class GoogleSheetTable {
constructor(url, mainSelector = 'main', title = '', noDataMessage = '') {
  this.url = url;
  this.mainElement = document.querySelector(mainSelector);
  this.table = null;
  this.title = title
  this.noDataMessage = noDataMessage
  this.injectStyles();


  this.uniqueId = Math.random().toString(36).substring(2); // Generate a random unique ID for each table

}


isMobileDevice() {
  return window.matchMedia("(max-width: 768px)").matches;
}


injectStyles() {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    @media (max-width: 768px) {
      .mobile-table-container {
        /* Your styles for mobile container */
      }
      .mobile-table-card {
        /* Your styles for each card */
        margin-bottom: 10px;
        border: 1px solid #ddd;
        padding: 10px;
        border-radius: 4px;
      }
      .mobile-table-date {
        /* Your styles for the date section of the card */
        font-weight: bold;
      }
      .mobile-table-details {
        /* Your styles for the details section of the card */
      }
      .table {
        display: none; /* Hide the table on mobile */
      }
    }
  `;
  document.head.appendChild(style);
}

setupResizeListener() {
  window.addEventListener('resize', this.debounce(() => {
    this.updateView(this.currentData, this.currentColumns);
  }, 250));
}

updateView(data, columns) {
  // Clear the current content
  this.mainElement.innerHTML = '';
  console.log(columns)

  // Decide which view to render based on the window size
  if (this.isMobileDevice()) {
    const mobileContainer = this.renderMobile(data, columns);
    this.mainElement.appendChild(mobileContainer);
  } else {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'text-center mt-3';

    const thead = this.createTableHeader(columns);
    const tbody = this.createTableBody(data, columns);

    this.table.appendChild(thead);
    this.table.appendChild(tbody);
    tableContainer.appendChild(this.table);
    this.mainElement.appendChild(tableContainer);
  }
}



debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}



fetchAndRender() {
  fetch(this.url)
    .then(response => response.text())
    .then(csvString => this.parseCSV(csvString))
    .then(data => {
      this.currentData = data;
      this.currentColumns = Object.keys(data[0]);
      this.renderTable(data);
    })
    .catch(err => console.error(err));


  this.setupResizeListener()


}

parseCSV(csvString) {
  return Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  }).data;
}

createTableHeader(columns) {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const searchRow = document.createElement('tr');
  columns.forEach((col, columnIndex) => {
    const th = document.createElement('th');
    th.innerText = col;
    headerRow.appendChild(th);

    const searchTh = document.createElement('th');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm'; 
    input.placeholder = `Search by ${col}`;

    (function(index) {

      input.addEventListener('keyup', event => this.filterTable(event, index));
    }).call(this, columnIndex + 1);

    searchTh.appendChild(input);
    searchRow.appendChild(searchTh);
  });

  thead.appendChild(headerRow);
  thead.appendChild(searchRow);
  return thead;
}

createTableBody(data, columns) {
  const tbody = document.createElement('tbody');
  tbody.id = `tableBody-${this.uniqueId}`;
  data.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.innerText = row[col];
      tr.appendChild(td);
    });

    // Check if the Status column says "Cancelled"
    if (row['Status'] === 'Cancelled') {
      tr.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // Faint shade of red
    }

    tbody.appendChild(tr);
  });
  return tbody;
}


renderMobileSearchFields(columns) {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-fields-container';
  columns.forEach((col, columnIndex) => {
    const searchField = document.createElement('input');
    searchField.type = 'text';
    searchField.placeholder = `Search by ${col}`;
    searchField.className = 'form-control form-control-sm mb-2';
    searchField.addEventListener('keyup', (event) => this.filterTableMobile(event, columnIndex + 1, columns));
    searchContainer.appendChild(searchField);
  });

  return searchContainer;
}

renderMobile(data, columns) {
  const container = document.createElement('div');
  container.className = 'mobile-table-container';
  container.classList.add('mt-3')
  const searchFields = this.renderMobileSearchFields(columns);
  container.appendChild(searchFields);
  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'mobile-table-card';
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'mobile-table-details';
    columns.forEach(col => {
      const detail = document.createElement('p');
      const keySpan = document.createElement('span');
      keySpan.className = 'key-col';
      keySpan.textContent = `${col}: `;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'val-col';
      valueSpan.textContent = row[col];
      detail.appendChild(keySpan);
      detail.appendChild(valueSpan);
      detailsDiv.appendChild(detail);
    });
    card.appendChild(detailsDiv);
    container.appendChild(card);
  });

  return container;
}


renderTable(data) {
  if (data.length === 0) {
    const messageElement = document.createElement('h2');
    messageElement.innerText = this.noDataMessage;
    this.mainElement.appendChild(messageElement);
    return;
  }

  if (this.title) {
    const titleElement = document.createElement('h2');
    titleElement.innerText = this.title;
    this.mainElement.appendChild(titleElement);
  }

  this.table = document.createElement('table');
  this.table.className = 'table table-striped table-bordered';  // Bootstrap classes for styling
  const columns = Object.keys(data[0]);
  const thead = this.createTableHeader(columns);
  const tbody = this.createTableBody(data, columns);
  thead.className = 'thead';
  const tableContainer = document.createElement('div');
  tableContainer.className = 'text-center mt-3';
  this.table.style.width = '100%';
  this.table.style.margin = '0 auto';
  if (this.mainElement) {
    columns.forEach((col, columnIndex) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Search by ${col}`;
      input.className = 'mx-1';
      (function(index) {
        input.addEventListener('keyup', event => this.filterTable(event, index));
      }).call(this, columnIndex + 1);  // +1 because nth-child is 1-based

    });


    if (this.isMobileDevice()) {
      const mobileContainer = this.renderMobile(data, columns);
      this.mainElement.appendChild(mobileContainer);
    

    } else {
      this.table.appendChild(thead);
      this.table.appendChild(tbody);
      tableContainer.appendChild(this.table);
      this.mainElement.appendChild(tableContainer);
    }


  }
}


filterTableMobile(event, columnIndex, columns) {
  const input = event.target.value.toLowerCase();
  const cards = document.querySelectorAll('.mobile-table-card');
  cards.forEach(card => {
    const keySpans = Array.from(card.querySelectorAll('.key-col'));
    const keyIndex = keySpans.findIndex(keySpan => keySpan.textContent.trim().toLowerCase().startsWith(columns[columnIndex - 1].toLowerCase() + ':'));
    const valueSpan = keyIndex !== -1 ? card.querySelectorAll('.val-col')[keyIndex] : null;
    if (valueSpan) {
      const cellValue = valueSpan.textContent.toLowerCase();
      card.style.display = cellValue.startsWith(input) ? '' : 'none';
    } else {
      card.style.display = 'none';
    }
  });
}

filterTable(event, columnIndex) {
  const input = event.target.value.toLowerCase();
  const rows = document.querySelectorAll(`#tableBody-${this.uniqueId} tr`);
  rows.forEach(row => {
    const cell = row.querySelector(`td:nth-child(${columnIndex})`);
    if (cell) {
      const cellValue = cell.innerText.toLowerCase();
      row.style.display = cellValue.startsWith(input) ? '' : 'none';
    }
  });
}

}
