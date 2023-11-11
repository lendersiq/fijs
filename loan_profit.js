 //globals 
var G_product_count = <?= json_encode($loan_type_counts) ?>;
var G_portfolio_table = [];
var G_product_table = <?= json_encode($product_table) ?>;
var G_branch_count = <?= json_encode($branch_loan_counts) ?>;
var G_branch_table = <?= json_encode($branch_table) ?>;

 function $$monthly_payment(columns, header_) {
    let $principal = parseFloat(columns[header_.indexOf('principal')]);
    let $monthly_rate = parseFloat(columns[header_.indexOf('rate')]) / 12;
    let months = $$term_in_months(columns, header_);
    let payment = $principal * $monthly_rate * (Math.pow(1 + $monthly_rate, months)) / (Math.pow(1 + $monthly_rate, months) - 1);
    $$screen_log("calculated payment", $$USDollar.format(payment)); 
    return payment; 
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

function start_upload(e) {
    e.preventDefault();
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        let file_content = e.target.result;
        let id_filter = document.getElementById('id-filter').value.trim();
        let CR = file_content.indexOf('\r');
        let LF = file_content.indexOf('\n');
        let header_end = LF > CR ? LF : CR;
        let $file_header = file_content.substring(0, header_end).trim();
        let errors = $$validate_header($file_header);
        if (errors) {
            $$error_log('file', errors);
        } else {
            let header_ = <?= json_encode(array_values($container_config['file_field_dict'])) ?>;
            let rows = file_content.split(/\r?\n|\r|\n/g);
            for (i=1; i < rows.length; i++) {  
                let columns = rows[i].split(',');
                if (!$$verify_csv_header(columns, header_)) break
                let $principal = parseFloat(columns[header_.indexOf('principal')]);
                if ($principal != 0) {
                    let $id = String(columns[header_.indexOf('ID')]).trim();
                    if ($id == id_filter || id_filter == null || id_filter == "") {
                        if (id_filter != null && id_filter != "") {
                            $$catalog_data(columns, header_, 'screen-console');    
                        }
                        //log warning
                        if( $$current_life_in_years(columns, header_) > 20 ) console.log(columns[header_.indexOf('principal')]);
                        let $type = parseInt(columns[header_.indexOf('type')]);
                        G_product_count[$type] += 1;
                        let $branch = columns[header_.indexOf('branch')].trim();
                        let loan_profit = parseFloat($$loan_profit(columns, header_));
                        temp_index = G_portfolio_table.findIndex(function(v,i) {
                            return v[0] == $id});
                        if (temp_index === -1)  {
                            G_portfolio_table.push([$id, loan_profit, 1]); 
                        } else {
                            G_portfolio_table[temp_index][1] += loan_profit;  
                            G_portfolio_table[temp_index][2] += 1; 
                        }
                        temp_index = G_product_table.findIndex(function(v,i) {
                            return v[0] === $type});
                        G_product_table[temp_index][2] += loan_profit;
                        G_product_table[temp_index][3] += $principal;
                        G_product_table[temp_index][4] += 1;
                        
                        temp_index = G_branch_table.findIndex(function(v,i) {
                            return v[0] === $branch});
                        if (typeof G_branch_table[temp_index] == 'undefined' || G_branch_table[temp_index] == null) {
                            $$error_log('config', 'branch ' + $branch + ' missing'); 
                        } else {
                            G_branch_table[temp_index][2] += loan_profit;
                            G_branch_table[temp_index][3] += $principal;
                            G_branch_table[temp_index][4] += 1;
                        }
                    }
                }
            }
            //sort product report by profit 
            G_product_table.sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));
            $$display_table('product report', 'report_div', ['Type', 'Product', 'Profit', 'Principal', 'Q'], G_product_table);
        
            //sort branch report by profit
            $$sort_display_table('branch report', 'report_div', ['Branch #', 'Name', 'Profit', 'Principal', 'Q'], G_branch_table, 2, 'des')
            
            //sort ranking report by profit
            G_portfolio_table.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            $$display_table('ranking report', 'report_div', ['ID', 'Profit', 'Q'], G_portfolio_table, true);
        }
    }
    reader.readAsText(file);
    consoleModal_.hide()
}
document.getElementById('file-input').addEventListener('change', start_upload, false);
