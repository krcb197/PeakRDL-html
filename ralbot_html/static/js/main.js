var CurrentID;

//==============================================================================
// Page actions
//==============================================================================

function load_page(id) {
    // Clears and populates the main div with content/{id}.html's content
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        var main_el = document.getElementById("content-container");
        if (this.readyState == 4 && (this.status == 200 || this.status == 0 && this.responseText)) {
            main_el.innerHTML = this.responseText;
            update_absolute_addr(get_absolute_addr(id));
        } else {
            if(window.location.protocol == "file:"){
                show_file_protocol_nag();
            }
        }
    };
    
    try {
        xhttp.open("GET", "content/" + id + ".html", true);
        xhttp.send();
    } catch(error) {
        if(window.location.protocol == "file:"){
            show_file_protocol_nag();
        }
    }
    
    CurrentID = id;
    update_crumbtrail();
    
}

function show_file_protocol_nag() {
    var el = document.getElementById("content-container");
    el.innerHTML
    = "<h1>Oops!</h1>"
    + "<p>Your browser's security policy prevents this page from loading properly when using the 'file://' protocol.</p>"
    + "<p>If possible, host this page on a web server and access using the 'http://' protocol.</p>"
    + "<h2>Other options</h2>"
    + "<ul>"
    + "    <li>Open this page using Firefox</li>"
    + "    <li>Open this page with Chrome using the '--allow-file-access-from-files' switch</li>"
    + "    <li>"
    + "        Host using a temporary Python http server:"
    + "        <pre>python -m http.server</pre>"
    + "    </li>"
    + "</ul>"
    ;
}

function load_page_via_url(){
    // An event triggered such that the page should be loaded based on the URL
    var path = window.location.hash.substring(1);
    if(path == ""){
        // No path specified. Default to root node
        CurrentID = 0;
    } else {
        // URL contains a hier path
        var parsed_path = parse_path(path);
        var new_path;
        if(parsed_path == null) {
            // Bad path. Discard it
            new_path = "";
            CurrentID = 0;
        } else {
            // Path is good.
            var id, idx_stack;
            id = parsed_path[0];
            idx_stack = parsed_path[1];
            apply_idx_stack(id, idx_stack);
            
            // Recompute the path in case it needs to be cleaned up
            new_path = get_path(id);
            CurrentID = id;
        }
        
        if(path != new_path){
            // Path was sanitized. Update URL
            set_url_hash("#" + new_path);
        }
    }
    
    load_page(CurrentID);
    select_tree_node();
    expand_to_tree_node();
    open_tree_node(CurrentID);
    scroll_to_tree_node(CurrentID);
    refresh_title();
}

function update_crumbtrail(){
    var crumb_el = document.getElementById("crumbtrail");
    var id = CurrentID;
    
    // Delete old crumbtrail
    while (crumb_el.hasChildNodes()) {
        crumb_el.removeChild(crumb_el.lastChild);
    }
    
    var path_ids = get_ids_in_path(id);
    
    for(var i=0; i<path_ids.length; i++){
        if(i < path_ids.length-1){
            var link = document.createElement("a");
            link.dataset.id = path_ids[i];
            link.className = "node-link";
            link.href = "#" + get_path(path_ids[i]);
            link.innerHTML = RALIndex[path_ids[i]].name;
            link.onclick = onClickNodeLink;
            crumb_el.appendChild(link);
        } else {
            var el = document.createElement("span");
            el.innerHTML = RALIndex[path_ids[i]].name;
            crumb_el.appendChild(el);
        }

        if("dims" in RALIndex[path_ids[i]]){
            for(var dim=0; dim<RALIndex[path_ids[i]].dims.length; dim++){
                var el = document.createElement("span");
                el.dataset.id = path_ids[i];
                el.dataset.dim = dim;
                el.className = "crumb-idx";
                el.onclick = onClickCrumbtrailIdx;
                el.innerHTML = "[" + RALIndex[path_ids[i]].idxs[dim] + "]";
                crumb_el.appendChild(el);
            }
        }
        
        if(i < path_ids.length-1){
            var el = document.createElement("span");
            el.className = "crumb-separator";
            crumb_el.appendChild(el);
        }
    }
}

function update_absolute_addr(addr){
    document.getElementById("abs-addr").innerHTML = "0x" + addr.toString(16);
}

function onClickNodeLink(ev) {
    var el = ev.target;
    var id = parseInt(el.dataset.id);
    if(id == CurrentID) return(false);
    
    reset_indexes_to_next(id);
    load_page(id);
    select_tree_node();
    expand_to_tree_node();
    open_tree_node(id);
    scroll_to_tree_node(id);
    refresh_url();
    refresh_title();
    
    return(false);
}

function refresh_url() {
    // Given current state, refresh the URL's hash
    var path = get_path(CurrentID);
    set_url_hash("#" + path);
}

function refresh_title() {
    // Given current state, refresh the page title text
    document.title = RALIndex[CurrentID].name;
}

var _ignore_hash_change = false;
function onURLHashChange() {
    if(_ignore_hash_change){
        _ignore_hash_change = false;
        return;
    }
    
    load_page_via_url();
}

function set_url_hash(str) {
    _ignore_hash_change = true;
    window.location.hash = str;
}

function onPageLoad() {
    window.onhashchange = onURLHashChange;
    init_tree();
    load_page_via_url();
    init_index_edit();
}

//==============================================================================
// Misc
//==============================================================================

function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return(true);
        }
        node = node.parentNode;
    }
    return(false);
}

//==============================================================================
// Compatibility Workarounds
//==============================================================================
// IE does not support Number.isInteger
function isInteger(num) {
    return (num ^ 0) === num;
}

// IE does not support <string>.startsWith
if(!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}
