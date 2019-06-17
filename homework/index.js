'use strict';

{
  function fetchJSON(url, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.onload = () => {
      if (xhr.status < 400) {
        cb(null, xhr.response);
      } else {
        cb(new Error(`Network error: ${xhr.status} - ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => cb(new Error('Network request failed'));
    xhr.send();
  }

  function createAndAppend(name, parent, options = {}) {
    const elem = document.createElement(name);
    parent.appendChild(elem);
    Object.keys(options).forEach(key => {
      const value = options[key];
      if (key === 'text') {
        elem.textContent = value;
      } else {
        elem.setAttribute(key, value);
      }
    });
    return elem;
  }

  function renderHeader(root, data) {
    // extract repo id, repo name from data
    const optionData = data.map(repo => ({ value: repo.id, text: repo.name }));

    const header = createAndAppend('div', root, { class: 'header', text: 'HYF repositories' });
    const repos = createAndAppend('select', header, {
      name: 'repositoryList',
      class: 'repository-list',
    });
    // populate the options
    optionData.forEach(values => createAndAppend('option', repos, values));
    console.log('initial', repos.options[repos.selectedIndex].value);
    // register an onchange event on the select
    repos.addEventListener('change', e => {
      console.log('eventy', e);
      repoDetails(null, data, e.target);
      contributorDetails(null, data, e.target);
    });
    return { header, repos };
  }

  const newRow = (parentTable, label, content) => {
    const row = createAndAppend('tr', parentTable);
    createAndAppend('td', row, { text: label, class: 'label' });
    // insert content
    if (typeof content !== 'object' || content === null) {
      createAndAppend('td', row, { text: `${!content ? '' : content}` });
    } else {
      const cell = createAndAppend('td', row);
      cell.appendChild(content);
    }
    return row;
  };

  const makeLink = (href, text) => {
    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.href = href;
    link.innerText = text;
    return link;
  };

  const activeRepo = (data, repos) => {
    const repoId = parseInt(repos.options[repos.selectedIndex].value, 10);
    return data.find(obj => obj.id === repoId);
  };

  function repoDetails(parent, data, repos) {
    const root = parent === null ? document.getElementById('repoDetailCard') : parent;
    // clear the parent's content
    root.innerHTML = '';
    // start creating the table
    const table = createAndAppend('table', root);
    const repoData = activeRepo(data, repos);
    // create repo link
    const link = makeLink(repoData.html_url, repoData.name);
    // fill in the rows
    newRow(table, 'Repository:', link);
    newRow(table, 'Description:', repoData.description);
    newRow(table, 'Forks:', repoData.forks_count);
    newRow(table, 'Updated:', repoData.updated_at);
    return root;
  }

  function contributorDetails(parent, data, repos) {
    const root = parent === null ? document.getElementById('contributorsCard') : parent;
    // clear data
    root.innerHTML = '';
    const repoData = activeRepo(data, repos);
    // fetch the contributors data
    fetchJSON(repoData.contributors_url, (err, data) => {
      if (err) {
        createAndAppend('div', root, { text: err.message, class: 'alert-error' });
      } else {
        console.log('contributors', data);
        createAndAppend('p', root, {
          class: 'contributor-header',
          text: 'Contributions',
        });
        const ul = createAndAppend('ul', root, { class: 'contributor-list' });
        data.map(profile => ul.appendChild(renderContributor(profile)));
      }
    });
  }

  function renderContributor(profile) {
    const li = document.createElement('li');
    li.setAttribute('class', 'contributor-item');
    // Add a click event listener
    li.addEventListener('click', () => {
      window.open(profile.html_url, '_blank');
    });
    createAndAppend('img', li, {
      src: profile.avatar_url,
      class: 'contributor-avatar',
      height: '48',
    });
    const data = createAndAppend('div', li, { class: 'contributor-data' });
    createAndAppend('div', data, { text: profile.login });
    createAndAppend('div', data, { class: 'contributor-badge', text: profile.contributions });
    return li;
  }

  // <li class="contributor-item" aria-label="mkruijt" tabindex="0">
  //   <img src="https://avatars2.githubusercontent.com/u/7113309?v=4" class="contributor-avatar" height="48">
  //   <div class="contributor-data">
  //     <div>mkruijt</div>
  //     <div class="contributor-badge">28</div>
  //   </div>
  // </li>

  function renderContent(root, data) {
    // blue bit at top of page
    const { repos } = renderHeader(root, data);
    // set up content containers
    const content = createAndAppend('div', root, { class: 'content' });
    const repoDetailsCard = createAndAppend('div', content, {
      class: 'left-div whiteframe',
      id: 'repoDetailCard',
    });
    const contributorsCard = createAndAppend('div', content, {
      class: 'right-div whiteframe',
      id: 'contributorsCard',
    });
    // fill in the content for the repo
    const repoCardDetails = repoDetails(repoDetailsCard, data, repos);
    // populate the contributors card
    const filledContributors = contributorDetails(contributorsCard, data, repos);
  }

  function main(url) {
    fetchJSON(url, (err, data) => {
      const root = document.getElementById('root');
      if (err) {
        createAndAppend('div', root, { text: err.message, class: 'alert-error' });
      } else {
        renderContent(root, data);
      }
    });
  }

  const HYF_REPOS_URL = 'https://api.github.com/orgs/HackYourFuture/repos?per_page=100';

  window.onload = () => main(HYF_REPOS_URL);
}
