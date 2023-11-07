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

function $$screen_log(label, value) {
    let id_filter = document.getElementById('id-filter').value.trim()
    if (id_filter != null && id_filter != "") {
        document.getElementById('screen-console').textContent += label + " : " + value + "\n"
        document.getElementById('fijs-console').style.display = "block"
    }
}

function $$error_log(label, _text) {
    document.getElementById('error-console').textContent += label + " error: " + _text + "\n"
    document.getElementById('fijs-console').style.display = "block";
}

function $$validate_header(header) {
    let header_errors = '';
    let columns = header.split(',');
    let config_headers_ = Object.keys(JSON.parse(document.getElementById('file_field_dict_').innerHTML));
    for (i=0; i < config_headers_.length; i++) {  
        if (!columns.includes(config_headers_[i])) {
            header_errors += 'missing header column: ' + config_headers_[i] + '\n';
        }
    }
    return header_errors;
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
    let $origination_date = new Date(columns[header_.indexOf('origination_date')]);  
    let today = new Date();
    let time_difference = today.getTime() - $origination_date.getTime();
    return parseFloat(time_difference / (1000 * 60 * 60 * 24 * 365));  
}

function $$display_table(name, id, header_array, table_array, counter_opt=false) {
    let sum = [];
    let id_column = -1;
    let table = document.createElement('table'); 
    table.classList.add('table');
    table.setAttribute("id", name.replace(/ /g,"_"));
    heading = document.createElement('thead'); 
    tr = document.createElement('tr'); 
    if (counter_opt) {
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
            if (counter_opt) {
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
    if (counter_opt) {
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

function $$sort_display_table(name, id, header_array, table_array, sort_column, sort_opt, counter_opt=false) { //sort options: ascending, descending, or false
    if (sort_opt.substring(0, 3).toLowerCase() == 'asc') {
        table_array.sort((a, b) => parseFloat(a[sort_column]) - parseFloat(b[sort_column]));
    } else if (sort_opt.substring(0, 3).toLowerCase() == 'des') { 
        table_array.sort((a, b) => parseFloat(b[sort_column]) - parseFloat(a[sort_column]));
    }
    $$display_table(name, id, header_array, table_array, counter_opt);
}

function $$catalog_data(columns, header_, id) {
    header_.forEach(function(column, c_index) {
        document.getElementById(id).innerHTML += column + " : " + columns[header_.indexOf(column)] + '\n';
    });
}

function $$estimate_payment(columns, header_) {
    let $principal = parseFloat(columns[header_.indexOf('principal')]);
    let $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
    let months = $$remaining_life_in_months(columns, header_);
    let payment = $principal * $monthly_rate * (Math.pow(1 + $monthly_rate, months)) / (Math.pow(1 + $monthly_rate, months) - 1);
    $$screen_log("estimated payment", $$USDollar.format(payment)); 
    return payment; 
}

function $$average_outstanding(columns, header_) {
    let $principal_temp = parseFloat(columns[header_.indexOf('principal')]);
    let $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
    let $payment = parseFloat(columns[header_.indexOf('payment')]);
    if ($payment < $principal_temp * $monthly_rate) {
        $payment = $$estimate_payment(columns, header_);
    }
    let $months = Math.max(Math.min($$remaining_life_in_months(columns, header_), 360), 1);
    let principal_sum = 0;
    let month = 0;
    while (month < $months && $principal_temp > 0) {
        principal_sum += $principal_temp;
        $principal_temp -= $payment - $principal_temp * $monthly_rate;
        month++;
    }
    average_outstanding = parseFloat(principal_sum / $months);
    if (average_outstanding < 0) {
        console.log('warning: average outstanding below zero', header_, columns);
    }
    $$screen_log("average outstanding", $$USDollar.format(average_outstanding)); 
    return average_outstanding;
}

function $$cost_of_funds(columns, header_) {
    if (typeof document.getElementById('funding_curve_') == 'undefined' || document.getElementById('funding_curve_') == null) {
        console.log('error: no curve defined');
    } else {
        let $principal_temp = parseFloat(columns[header_.indexOf('principal')]);
        let $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
        let $payment = parseFloat(columns[header_.indexOf('payment')]);
        if ($payment < $principal_temp * $monthly_rate) {
            $payment = $$estimate_payment(columns, header_);
        }
        let $months = Math.max(Math.min($$remaining_life_in_months(columns, header_), 360), 1);
        let COFR_array_ = JSON.parse(document.getElementById('funding_curve_').innerHTML);
        let principal_sum = 0.0;
        let paydown = 0.0;
        let month = 1;
        let COF_sum = 0.0;
        while (month <= $months && $principal_temp > 0) {
            paydown = $payment - ($principal_temp * $monthly_rate);
            COF_sum += paydown * COFR_array_[month] / 100 * month;
            $principal_temp -= paydown
            month++;
        }    
        let cost_of_funds = COF_sum / $months;
        $$screen_log("cost of funds", $$USDollar.format(cost_of_funds)); 
        let line_cost_of_funds = parseFloat(parseFloat(columns[header_.indexOf('principal')]) / 2 * COFR_array_[12] / 100);
        $$screen_log("line cost of funds", $$USDollar.format(line_cost_of_funds)); 
        return cost_of_funds;
    }
}

function $$target_funding_cost(columns, header_) {
    if (typeof document.getElementById('margin_target_') == 'undefined' || document.getElementById('margin_target_') == null) {
        console.log('error: no margin target defined');
    } else {
        let $margin_target = parseFloat(document.getElementById('margin_target_').innerHTML.trim());
        let $principal_temp = parseFloat(columns[header_.indexOf('principal')]);
        let $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
        let $payment = parseFloat(columns[header_.indexOf('payment')]);
        if ($payment < $principal_temp * $monthly_rate) {
            $payment = $$estimate_payment(columns, header_);
        }
        let $months = Math.max(Math.min($$remaining_life_in_months(columns, header_), 360), 1);
        let principal_sum = 0.0;
        let paydown = 0.0;
        let month = 1;
        let COF_sum = 0.0;
        while (month <= $months && $principal_temp > 0) {
            paydown = $payment - ($principal_temp * $monthly_rate);
            COF_sum += paydown * $margin_target * month;
            $principal_temp -= paydown
            month++;
        }    
        let cost_of_funds = COF_sum / $months;
        $$screen_log("cost of funds", $$USDollar.format(cost_of_funds)); 
        let line_cost_of_funds = parseFloat(parseFloat(columns[header_.indexOf('principal')]) / 2 * $margin_target);
        $$screen_log("line cost of funds", $$USDollar.format(line_cost_of_funds)); 
        return cost_of_funds;
    }
}

function $$interest_income(columns, header_) {
    let risk_rating_dict_ = JSON.parse(document.getElementById('risk_rating_dict_').innerHTML);
    let $risk_rating = columns[header_.indexOf('risk_rating')].trim();
    if (risk_rating_dict_[$risk_rating] == 'non-accrual') {
        return 0;
    } else {
        let $rate = columns[header_.indexOf('rate')];
        if ($rate > 1 && $rate <= 100) {
            $rate = $rate / 100;
        } else if ($rate < .001 || $rate > 100)  {
            console.log('error: rate out of range');
        }
        interest_income = $$average_outstanding(columns, header_) * $rate;
        $$screen_log("interest income", $$USDollar.format(interest_income));
        return interest_income;
    }
}

function $$loan_line_fees(columns, header_) {
    $fees = columns[header_.indexOf('fees')] / $$current_life_in_years(columns, header_);
    $$screen_log("fees", $$USDollar.format($fees));
    return $fees;
}

function $$reserve_expense(columns, header_) {
    let $type = columns[header_.indexOf('type')].trim();
    let $risk_rating = columns[header_.indexOf('risk_rating')].trim();
    let loan_types_ = JSON.parse(document.getElementById('loan_types_').innerHTML);
    let default_dict_ = JSON.parse(document.getElementById('default_dict_').innerHTML);
    let risk_rating_dict_ = JSON.parse(document.getElementById('risk_rating_dict_').innerHTML);
    if (typeof loan_types_[$type] === 'undefined') {
        return 'type ' + $type + ' missing from config dictionary';
    } else {
        if (risk_rating_dict_[$risk_rating] == 'non-accrual') {
            default_probability_ = 0;
        } else if (typeof risk_rating_dict_[$risk_rating] === 'undefined') { 
            default_probability_ = default_dict_[loan_types_[$type][1]]; //no adjustment    
        } else {
            let risk_adjustment = parseFloat(risk_rating_dict_[$risk_rating]);
            default_probability_ = default_dict_[loan_types_[$type][1]] * risk_adjustment;
        }
        let default_LTV_ = 0.80;
        let default_collateral_recovery_ = 0.50;
        let exposure_at_default_ = 1 / default_LTV_ * default_collateral_recovery_;
        let average_outstanding = $$average_outstanding(columns, header_);
        if (typeof document.getElementById('operating_risk_minimum_') == 'undefined' || document.getElementById('operating_risk_minimum_') == null) {
            //use default
            let operating_risk_minimum_ = 0.0015;
        } else {
            let operating_risk_minimum_ = parseFloat(document.getElementById('operating_risk_minimum_').innerHTML);
        }
        let reserve_expense = average_outstanding * operating_risk_minimum_  >  average_outstanding * exposure_at_default_ * default_probability_ ? average_outstanding * operating_risk_minimum_ : average_outstanding * exposure_at_default_ * default_probability_;
        $$screen_log("reserve expense", $$USDollar.format(reserve_expense));
        return reserve_expense;
    }
}

function $$operating_expense(columns, header_) {
    let $principal = columns[header_.indexOf('principal')].trim();
    let $type = columns[header_.indexOf('type')].trim();
    //G_product_count[$type] += 1;
    let loan_types_ = JSON.parse(document.getElementById('loan_types_').innerHTML);
    if (typeof loan_types_[$type] === 'undefined') {
        return 'type ' + $type + ' missing from config dictionary';
    } else {
        let product_configuration_ = JSON.parse(document.getElementById('institution_product_configuration_').innerHTML);
        let cost_factor_ = parseFloat(product_configuration_[loan_types_[$type][1]][1]);
        let principal_cap = Math.min(parseFloat(product_configuration_[loan_types_[$type][1]][2]), $principal);
        let efficiency_ratio_ = parseFloat(document.getElementById('institution_efficiency_').innerHTML);
        let origination_expense = cost_factor_ * .01 * principal_cap * efficiency_ratio_ / Math.max($$current_life_in_years(columns, header_), 5);
        $$screen_log("origination expense", $$USDollar.format(origination_expense));
        let servicing_expense = principal_cap * parseFloat(document.getElementById('servicing_factor_').innerHTML) / Math.max($$current_life_in_years(columns, header_), 5);
        $$screen_log("servicing expense", $$USDollar.format(servicing_expense));
        let operating_expense = origination_expense + servicing_expense;
        $$screen_log("operating expense", $$USDollar.format(operating_expense));
        return operating_expense;
    }
}

function $$tax_expense(columns, header_, net_income) {
    let product_configuration_ = JSON.parse(document.getElementById('institution_product_configuration_').innerHTML);
    let loan_types_ = JSON.parse(document.getElementById('loan_types_').innerHTML);
    let $type = columns[header_.indexOf('type')].trim();
    let tax_expense = 0;
    if (typeof product_configuration_[loan_types_[$type][1]][3] == 'undefined') {  //not tax exempt
        let tax_rate_ = parseFloat(document.getElementById('institution_tax_rate_').innerHTML);
        tax_expense = Math.abs(tax_rate_ * net_income);     
    }
    $$screen_log("pre-tax net income", $$USDollar.format(net_income));
    $$screen_log("tax expense", $$USDollar.format(tax_expense));
    return parseFloat(tax_expense);
}

function $$loan_profit(columns, header_)  {  
    let interest_income = $$interest_income(columns, header_);
    if (typeof interest_income === 'string') return 'error 1: ' + interest_income; 
    let fees = $$loan_line_fees(columns, header_);
    if (typeof fees === 'string') return 'error 2: ' + fees;
    //2 Methods let cost_of_funds = $$cost_of_funds(columns, header_);
    let cost_of_funds = $$target_funding_cost(columns, header_);
    let operating_expense = $$operating_expense(columns, header_);
    if (typeof operating_expense === 'string') return 'error 3: ' + operating_expense;
    let net_income = interest_income + fees - operating_expense - cost_of_funds;
    net_income -= $$tax_expense(columns, header_, net_income);
    let reserve_expense = $$reserve_expense(columns, header_);
    if (typeof reserve_expense === 'string') return 'error 3: ' + reserve_expense;
    net_income -= reserve_expense;
    if (isNaN(net_income)) console.log(header_, columns, $$interest_income(columns, header_), $$loan_line_fees(columns, header_), $$cost_of_funds(columns, header_), $$operating_expense(columns, header_), $$reserve_expense(columns, header_), $$average_outstanding(columns, header_), $type = columns[header_.indexOf('type')].trim() );
    let id_filter = document.getElementById('id-filter').value.trim();
    if (id_filter != null && id_filter != "") {
        document.getElementById('screen-console').textContent += "net income : " + $$USDollar.format(net_income) + '\n';   
    }
    return net_income;
}
