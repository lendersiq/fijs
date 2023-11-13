/*!
  FI.js v1.0.1 (https://fijs.net/)
*/

let $$USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

let $$twoDigit = new Intl.NumberFormat('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
});

function $$encryptString(str) {
    let shift_string  = document.getElementById('mask_encryption_').innerHTML;
    let encrypted_string = '';
    for (let i = 0; i < str.length; i++) {
        let shiftCode = shift_string.charCodeAt(Math.min(i, shift_string.length-1));
        if (shiftCode >= 48 && shiftCode <= 57) {
            shift = shiftCode - 48;
        } else if (shiftCode >= 65 && shiftCode <= 90) {
            shift = shiftCode - 65;
        } else {
            shift = shiftCode - 97;
        }                 

        let charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            encrypted_string += String.fromCharCode((charCode - 48 + shift) % 26 + 97);
        } else if (charCode >= 65 && charCode <= 90) {
            encrypted_string += String.fromCharCode((charCode - 65 + shift) % 26 + 65);
        } else if (charCode >= 97 && charCode <= 122) {
            // lowercase letters
            encrypted_string += String.fromCharCode((charCode - 97 + shift) % 26 + 97);
        } else {
            // non-alphabetic characters
            encrypted_string += str.charAt(i);
        }
    }
    return encrypted_string;
}

function $$calculate(str) {
  return Function(`'use strict'; return (${str})`)()
}

function $$process_dict(arg) {
    _args = arg.replace(/[\[\]']+/g,'').split(':')
    el = G_container_[_args[0]]
    return el[_args[1]]
}

function $$process_objs(arg) {
    key = arg.replace(/[\{\}']+/g,'')
    if (typeof window['$$' + key] === 'function') {
        return window['$$' + key]()
    } else {
        return G_container_[key]
    }
}

function $$process_pipe(arg, columns, header_) {
    let key = arg.replace(/[\|\|']+/g,'')
    if (key.includes('@')) {
        key = key.replace('@', '')
        const value = columns[header_.indexOf(key)]
        const pointer = JSON.parse(document.getElementById(key + '_pointer_').innerHTML)
        return parseInt(pointer[value][1])
    } else {
        return parseFloat(columns[header_.indexOf(key)])
    }
}

function $$screen_log(label, value) {
    let id_filter = document.getElementById('id-filter').value.trim()
    if (id_filter != null && id_filter != "") {
        if (!document.getElementById('screen-console').textContent.includes(label)) {
            document.getElementById('screen-console').textContent += label + " : " + value + "\n"
            document.getElementById('fijs-console').style.display = "block"
        }
    }
}

function $$error_log(label, _text) {
    document.getElementById('error-console').textContent += label + " error: " + _text + "\n"
    document.getElementById('fijs-console').style.display = "block";
}

function $$verify_csv_header(columns, header_) {
    if (columns.length != header_.length) {
        $$error_log('file header', 'columns: ' + columns.length + ' <mismatch> header: ' +  header_.length)
    }
   return columns.length == header_.length
}

function $$validate_header(header) {
    let header_errors = ''
    let columns = header.split(',')
    let config_headers_ = Object.keys(JSON.parse(document.getElementById('file_field_dict_').innerHTML))
    for (i=0; i < config_headers_.length; i++) {  
        if (!columns.includes(config_headers_[i])) {
            header_errors += 'missing header column: ' + config_headers_[i] + '\n'
        }
    }
    return header_errors
}

function $$term_in_months(columns, header_) {
    let $maturity_date = new Date(columns[header_.indexOf('maturity_date')]);
    let $origination_date = new Date(columns[header_.indexOf('origination_date')]); 
    let time_difference = $maturity_date.getTime() - $origination_date.getTime();
    return Math.max(1, parseInt(time_difference / (1000 * 60 * 60 * 24 * 30)));  
}

function $$remaining_life_in_months(columns, header_) {
    let $maturity_date = new Date(columns[header_.indexOf('maturity_date')]); 
    let today = new Date();
    let time_difference = $maturity_date.getTime() - today.getTime();
    return Math.max(1, parseInt(time_difference / (1000 * 60 * 60 * 24 * 30)));  
}

function $$remaining_life_in_years(columns, header_) {
    let $maturity_date = new Date(columns[header_.indexOf('maturity_date')]); 
    let today = new Date();
    let time_difference = $maturity_date.getTime() - today.getTime();
    return parseFloat(time_difference / (1000 * 60 * 60 * 24 * 365));  
}

function $$current_life_in_years(columns, header_) {
    const $origination_date = new Date(G_columns[G_header_.indexOf('origination_date')])  
    const today = new Date()
    const time_difference = today.getTime() - $origination_date.getTime()
    const life = parseFloat(time_difference / (1000 * 60 * 60 * 24 * 365))
    $$screen_log("life in years", $$twoDigit.format(life))
    return life  
}

function $$display_table(name, id, header_array, table_array, ranking_opt=false) { //ranking_opt when true places the rank in column 1 
    let sum = [];
    let id_column = -1;
    let table = document.createElement('table'); 
    table.classList.add('table');
    table.setAttribute("id", name.replace(/ /g,"_"));
    heading = document.createElement('thead'); 
    tr = document.createElement('tr'); 
    if (ranking_opt) {
        th = document.createElement('th'); 
        th.innerHTML = '#';
        tr.appendChild(th);
    }
    header_array.forEach(function(head, h_index) {
        if (head == 'ID') {
            id_column = h_index; 
        }
        th = document.createElement('th'); 
        th.innerHTML = head;
        tr.appendChild(th);
    });
    heading.appendChild(tr);
    table.appendChild(heading);  
    let count = 1;
    table_array.forEach(function(row, r_index) {
        if (row[row.length-1] != 0) { //hack
            tr = document.createElement('tr');
            if (ranking_opt) {
                td = document.createElement('td'); 
                td.innerHTML = count;
                tr.appendChild(td);
                count++;
            }
            for (column = 0; column < row.length; column++) {
                td = document.createElement('td');
                if (column == id_column) {
                    td.id = row[column];
                    td.innerHTML = $$encryptString(row[column]);
                } else if ( row[column] !== "" && !isNaN(row[column]) ) {
                    if (Math.round(row[column]) != row[column]) {
                        td.innerHTML = $$USDollar.format(row[column]);
                    } else {
                        td.innerHTML = row[column];
                    }
                    if (typeof sum[column] === 'undefined') {
                        sum[column] = row[column];
                    } else {
                        sum[column] += row[column];
                    }   
                } else {
                    td.innerHTML = row[column];
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    });
    tr = document.createElement('tr');
    if (ranking_opt) {
        th = document.createElement('th');
        th.innerHTML = '';
        tr.appendChild(th);
    }
    th = document.createElement('th');
    th.innerHTML = '';
    tr.appendChild(th);
    for (column = 1; column < header_array.length; column++) {
        th = document.createElement('th');
        if (typeof sum[column] === 'undefined') {
            th.innerHTML = '';
        } else if ( Math.round(sum[column]) != sum[column] ) {
            th.innerHTML = $$USDollar.format(sum[column]);
        } else {
            th.innerHTML = sum[column];
        }
        tr.appendChild(th);
    }
    table.appendChild(tr);
    document.getElementById(id).appendChild(table);
}

function $$sort_display_table(name, id, header_array, table_array, sort_column, sort_opt, ranking_opt=false) { //sort options: ascending, descending, or false & ranking_opt when true places the rank in column 1 
    if (sort_opt.substring(0, 3).toLowerCase() == 'asc') {
        table_array.sort((a, b) => parseFloat(a[sort_column]) - parseFloat(b[sort_column]));
    } else if (sort_opt.substring(0, 3).toLowerCase() == 'des') { 
        table_array.sort((a, b) => parseFloat(b[sort_column]) - parseFloat(a[sort_column]));
    }
    $$display_table(name, id, header_array, table_array, ranking_opt);
}

function $$catalog_data(columns, header_, id) {
    header_.forEach(function(column, c_index) {
        document.getElementById(id).textContent += column + " : " + columns[header_.indexOf(column)] + '\n'
    })
    document.getElementById('fijs-console').style.display = "block"
}
