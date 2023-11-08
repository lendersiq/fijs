 //globals 
var G_product_count = <?= json_encode($dda_type_counts) ?>;
var G_portfolio_table = [];
var G_product_table = <?= json_encode($product_table) ?>;
var G_branch_count = <?= json_encode($branch_loan_counts) ?>;
var G_branch_table = <?= json_encode($branch_table) ?>;

function $$credit_for_funding(columns, header_)  {
    if (typeof document.getElementById('margin_target_') == 'undefined' || document.getElementById('margin_target_') == null) {
        console.log('error: no margin target defined')
    } else {
        let $margin_target = parseFloat(document.getElementById('margin_target_').innerHTML.trim())
        let $capital_target = parseFloat(document.getElementById('capital_target_').innerHTML.trim())
        let $fraud_loss = parseFloat(document.getElementById('fraud_loss_').innerHTML.trim())
        let capital_expense = $capital_target * $fraud_loss
        let $balance = parseFloat(columns[header_.indexOf('balance')])
        let credit_for_funding = $balance * ($margin_target - capital_expense)
        $$screen_log("credit for funding", $$USDollar.format(credit_for_funding))
        return credit_for_funding
    }
}

function $$non_interest_income(columns, header_)  {
    let $service_charge = parseFloat(columns[header_.indexOf('balance')])
    let $charge_waived = parseFloat(columns[header_.indexOf('charge_waived')])
    let $other_charge = parseFloat(columns[header_.indexOf('other_charge')])	
    let $other_waived = parseFloat(columns[header_.indexOf('other_waived')])
    let $NSF = parseFloat(columns[header_.indexOf('NSFs')])
    let $NSF_waived = parseFloat(columns[header_.indexOf('NSF_waived')])
    let $NSF_refund = parseFloat(columns[header_.indexOf('NSF_refund')])
    let $NSF_fee = parseFloat(document.getElementById('NSF_fee_').innerHTML.trim())
    let non_interest_income = $service_charge - $charge_waived
    non_interest_income = $other_charge - $other_waived
    non_interest_income = $NSF * $NSF_fee - $NSF_refund - $NSF_fee
    return non_interest_income * 12 //annualize monthly calculations
}

function $$activity_cost(columns, header_)  {
    let $deposits = parseFloat(columns[header_.indexOf('deposits')])
    let $deposit_unit_cost = parseFloat(document.getElementById('deposit_unit_cost_').innerHTML.trim())
    return $deposits * $deposit_unit_cost * 12;
}

function $$dda_profit(columns, header_)  {
    net_income = $$non_interest_income(columns, header_)
    net_income += $$credit_for_funding(columns, header_)
    net_income -= parseFloat(columns[header_.indexOf('NSF_refund')]) * 12;
    net_income -= $$activity_cost(columns, header_)
    return net_income
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
        let $file_header = file_content.substring(0, header_end);
        let errors = $$validate_header($file_header);
        if (errors) {
            $$error_log('file header', errors);
        } else {
            let header_ = <?= json_encode(array_values($container_config['file_field_dict'])) ?>;
            let rows = file_content.split(/\r?\n|\r|\n/g);
            for (i=1; i < rows.length; i++) {  
                let columns = rows[i].split(',');
                let $balance = parseFloat(columns[header_.indexOf('balance')]);
                if ($balance != 0) {
                    let $id = String(columns[header_.indexOf('ID')]).trim();
                    if ($id == id_filter || id_filter == null || id_filter == "") {
                        if (id_filter != null && id_filter != "") {
                            $$catalog_data(columns, header_, 'screen-console');    
                        }
                        let $type = parseInt(columns[header_.indexOf('type')]);
                        G_product_count[$type] += 1;
                        let $branch = columns[header_.indexOf('branch')].trim();
                        let dda_profit = parseFloat($$dda_profit(columns, header_));
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
            $$display_table('product report', 'report_div', ['Type', 'Product', 'Profit', 'Balance', 'Q'], G_product_table);
        
            //sort branch report by profit
            $$sort_display_table('branch report', 'report_div', ['Branch #', 'Name', 'Profit', 'Balance', 'Q'], G_branch_table, 2, 'des')
            
            //sort ranking report by profit
            G_portfolio_table.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            $$display_table('ranking report', 'report_div', ['ID', 'Profit', 'Q'], G_portfolio_table, true);
        }
    }
    reader.readAsText(file);
    consoleModal_.hide()
}
document.getElementById('file-input').addEventListener('change', start_upload, false);
