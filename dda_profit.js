var G_portfolio_table = [];

function $$calc_profit(columns, header_)  {
    process_pipes = G_container_['formula'].replace(/\|\w+\|/ig, key => $$process_pipes(key, columns, header_))
    process_objs = process_pipe.replace(/\{\w+\}/ig, key => $$process_objs(key)) 
    process_dicts = process_objs.replace(/\[[\w':]+\]/ig, key => $$process_dicts(key))
    return $$calculate(process_dicts)
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
        let $file_header = file_content.substring(0, header_end).trim()
        let errors = $$validate_header($file_header);
        if (errors) {
            $$error_log('file header', errors);
        } else {
            let header_ = <?= json_encode(array_values($container_config['file_field_dict'])) ?>;
            let rows = file_content.split(/\r?\n|\r|\n/g);
            for (i=1; i < rows.length; i++) {  
                let columns = rows[i].split(',');
                if (!$$verify_csv_header(columns, header_)) break
                let $balance = parseFloat(columns[header_.indexOf('balance')]);
                if ($balance != 0) {
                    let $id = String(columns[header_.indexOf('ID')]).trim();
                    if ($id == id_filter || id_filter == null || id_filter == "") {
                        if (id_filter != null && id_filter != "") {
                            $$catalog_data(columns, header_, 'screen-console');    
                        }
                        let $type = parseInt(columns[header_.indexOf('type')])
                        if (typeof G_product_count[$type] == 'undefined' || G_product_count[$type] == null) {
                            $$error_log('config', 'type ' + $type + ' missing')
                        } else {
                            G_product_count[$type] += 1
                        }
                        let $branch = columns[header_.indexOf('branch')].trim();
                        let profit = parseFloat($$calc_profit(columns, header_));
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
                        G_product_table[temp_index][3] += $balance;
                        G_product_table[temp_index][4] += 1;
                        
                        temp_index = G_branch_table.findIndex(function(v,i) {
                            return v[0] === $branch});
                        if (typeof G_branch_table[temp_index] == 'undefined' || G_branch_table[temp_index] == null) {
                            $$error_log('config', 'branch ' + $branch + ' missing'); 
                        } else {
                            G_branch_table[temp_index][2] += profit;
                            G_branch_table[temp_index][3] += $balance;
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
