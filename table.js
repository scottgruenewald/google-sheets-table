class GoogleSheetTable {
  constructor(url, mainSelector = 'main', title = '') {
    this.url = url;
    this.mainElement = document.querySelector(mainSelector);
    console.log(this.mainElement)
    this.table = null;
    this.title = title
    this.uniqueId = Math.random().toString(36).substring(2); // Generate a random unique ID for each table

  }

  fetchAndRender() {
    fetch(this.url)
      .then(response => response.text())
      .then(csvString => this.parseCSV(csvString))
      .then(data => this.renderTable(data))
      .catch(err => console.error(err));
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
      input.className = 'form-control form-control-sm';  // Bootstrap class
      input.placeholder = `Search by ${col}`;

      (function(index) {

        input.addEventListener('keyup', event => this.filterTable(event, index));
      }).call(this, columnIndex + 1);  // +1 because nth-child is 1-based

      searchTh.appendChild(input);
      searchRow.appendChild(searchTh);
    });

    thead.appendChild(headerRow);
    thead.appendChild(searchRow);  // Add searchRow to thead
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
  renderTable(data) {
    this.table = document.createElement('table');
    this.table.className = 'table table-striped table-bordered';  // Bootstrap classes for styling

    const columns = Object.keys(data[0]);
    const thead = this.createTableHeader(columns);
    const tbody = this.createTableBody(data, columns);

    thead.className = 'thead-dark';

    this.table.appendChild(thead);
    this.table.appendChild(tbody);


    const tableContainer = document.createElement('div');
    tableContainer.className = 'text-center mt-3';
    tableContainer.appendChild(this.table);
    this.table.style.width = '100%';
    this.table.style.margin = '0 auto';

    if (this.mainElement) {

      // Create search fields


      // The modified portion starts here
      columns.forEach((col, columnIndex) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Search by ${col}`;
        input.className = 'mx-1';
    
        // Wrap your event listener setup in an IIFE
        (function(index) {
          input.addEventListener('keyup', event => this.filterTable(event, index));
        }).call(this, columnIndex + 1);  // +1 because nth-child is 1-based

      });


      this.mainElement.appendChild(tableContainer);
    }
  }


  // Function to filter table based on search fields
  filterTable(event, columnIndex) {
    const input = event.target.value.toLowerCase();
    const rows = document.querySelectorAll(`#tableBody-${this.uniqueId} tr`);
    rows.forEach(row => {
      const cell = row.querySelector(`td:nth-child(${columnIndex})`);
      if (cell) {
        const cellValue = cell.innerText.toLowerCase();
        row.style.display = cellValue.startsWith(input) ? '' : 'none';  // Changed this line
      }
    });
  }
   
}

