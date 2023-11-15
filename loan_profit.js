var G_portfolio_table = []
var G_columns = []

function $$estimate_payment() {
    let $principal = parseFloat(G_columns[G_header_.indexOf('principal')])
    let $monthly_rate = parseFloat(G_columns[G_header_.indexOf('rate')]) / 12
    let months = $$remaining_life_in_months(G_columns, G_header_)
    let payment = $principal * $monthly_rate * (Math.pow(1 + $monthly_rate, months)) / (Math.pow(1 + $monthly_rate, months) - 1)
    $$screen_log("estimated payment", $$USDollar.format(payment))
    return payment
}

function $$average_outstanding() {
    let $principal_temp = parseFloat(G_columns[G_header_.indexOf('principal')])
    let $monthly_rate = parseFloat(G_columns[G_header_.indexOf('rate')]) / 12
    let $payment = parseFloat(G_columns[G_header_.indexOf('payment')])
    if ($payment < $principal_temp * $monthly_rate) {
        $payment = $$estimate_payment()
    }
    let $months = Math.max(Math.min($$remaining_life_in_months(G_columns, G_header_), 360), 1)
    let principal_sum = 0
    let month = 0
    while (month < $months && $principal_temp > 0) {
        principal_sum += $principal_temp
        $principal_temp -= $payment - $principal_temp * $monthly_rate
        month++
    }
    average_outstanding = parseFloat(principal_sum / $months)
    if (average_outstanding < 0) {
        console.log('warning: average outstanding below zero', G_header_, G_columns)
    }
    return average_outstanding.toFixed(2);
}

function $$cost_of_funds() {
    if (typeof document.getElementById('funding_curve_') == 'undefined' || document.getElementById('funding_curve_') == null) {
        console.log('error: no curve defined')
    } else {
        let $principal_temp = parseFloat(G_columns[G_header_.indexOf('principal')])
        let $monthly_rate = parseFloat(G_columns[G_header_.indexOf('rate')]) / 12
        let $payment = parseFloat(G_columns[G_header_.indexOf('payment')])
        if ($payment < $principal_temp * $monthly_rate) {
            $payment = $$estimate_payment()
        }
        let $months = Math.max(Math.min($$remaining_life_in_months(G_columns, G_header_), 360), 1)
        let COFR_array_ = JSON.parse(document.getElementById('funding_curve_').innerHTML)
        let principal_sum = 0.0
        let paydown = 0.0
        let month = 1
        let COF_sum = 0.0
        while (month <= $months && $principal_temp > 0) {
            paydown = $payment - ($principal_temp * $monthly_rate)
            COF_sum += paydown * COFR_array_[month] / 100 * month
            $principal_temp -= paydown
            month++
        }    
        let cost_of_funds = COF_sum / $months
        $$screen_log("cost of funds", $$USDollar.format(cost_of_funds))
        let line_cost_of_funds = parseFloat(parseFloat(G_columns[G_header_.indexOf('principal')]) / 2 * COFR_array_[12] / 100)
        $$screen_log("line cost of funds", $$USDollar.format(line_cost_of_funds))
        return cost_of_funds
    }
}

function start_upload(e) {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const file_content = e.target.result
        const id_filter = document.getElementById('id-filter').value.trim()
        let ID_match = false;
        const CR = file_content.indexOf('\r');
        const LF = file_content.indexOf('\n');
        const header_end = LF > CR ? LF : CR;
        const $file_header = file_content.substring(0, header_end).trim();
        const errors = $$validate_header($file_header);
        if (errors) {
            $$error_log('file', errors);
        } else {
            let rows = file_content.split(/\r?\n|\r|\n/g);
            for (i=1; i < rows.length; i++) {  
                G_columns = rows[i].split(',');
                if (!$$verify_csv_header(G_columns, G_header_)) break
                let $principal = parseFloat(G_columns[G_header_.indexOf('principal')]);
                if ($principal != 0) {
                    let $id = String(G_columns[G_header_.indexOf('ID')]).trim();
                    if ($id == id_filter || id_filter == null || id_filter == "") { //must match |ID| or be blank 
                        if ($id == id_filter) {
                            ID_match = true;    
                        } else {
                            ID_match = false;    
                        }
                        let $type = parseInt(G_columns[G_header_.indexOf('type')]);
                        G_product_count[$type] += 1;
                        let $branch = G_columns[G_header_.indexOf('branch')].trim();
                        //let profit = parseFloat($$calc_profit())
                        profit = $$process_formula(ID_match)
                        
                        temp_index = G_portfolio_table.findIndex(function(v,i) {
                            return v[0] == $id});
                        if (temp_index === -1)  {
                            G_portfolio_table.push([$id, profit, 1]); 
                        } else {
                            G_portfolio_table[temp_index][1] += profit;  
                            G_portfolio_table[temp_index][2] += 1; 
                        }
                        temp_index = G_product_table.findIndex(function(v,i) {
                            return v[0] === $type});
                        G_product_table[temp_index][2] += profit;
                        G_product_table[temp_index][3] += $principal;
                        G_product_table[temp_index][4] += 1;
                        
                        temp_index = G_branch_table.findIndex(function(v,i) {
                            return v[0] === $branch});
                        if (typeof G_branch_table[temp_index] == 'undefined' || G_branch_table[temp_index] == null) {
                            $$error_log('config', 'branch ' + $branch + ' missing'); 
                        } else {
                            G_branch_table[temp_index][2] += profit;
                            G_branch_table[temp_index][3] += $principal;
                            G_branch_table[temp_index][4] += 1;
                        }
                    }
                }
            }
            $$sort_display_table('product report', 'report_div', ['Type', 'Product', 'Profit', 'Principal', 'Q'], G_product_table, 2, 'des');
            $$sort_display_table('branch report', 'report_div', ['Branch #', 'Name', 'Profit', 'Principal', 'Q'], G_branch_table, 2, 'des')
            
            //sort ranking report by profit
            G_portfolio_table.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            $$display_table('ranking report', 'report_div', ['ID', 'Profit', 'Q'], G_portfolio_table, true);
        }
    }
    reader.readAsText(file);
    consoleModal_.hide()
}
document.getElementById('file-input').addEventListener('change', start_upload, false)
