const LOOKUP_API = 'http://127.0.0.1:9000/?addr='
function generateNav(result){
    for(const [key, value] of Object.entries(result)){
        let newButton = document.createElement('span');
        newButton.id = key;
        newButton.classList.add('button');
        newButton.result = value;
        newButton.stat = getStat(value);
        let newText = document.createTextNode(key);
        newButton.appendChild(newText);
        newButton.addEventListener('click', function(e){
            let colorList = showPieChart(e.target.stat);
            showGridjsStatTable(e.target.stat, colorList);
            showGridjsResultTable(e.target.result);
            // showStatTable(e.target.stat);
            // showResultTable(e.target.result);
        });
        for(const v of newButton.result){
            if(v.status === null){
                v.status = '';
            }
            if(v.city === null){
                v.city = '';
            }
            v.log = {text: 'log', info: v.log};
            v.whois = {text: 'whois', info: v.whois};
            v.lookup = {text: 'lookup', info: null};
        }
        document.getElementById('navigation').appendChild(newButton);
    }
}

// Table with Gridjs library.
function showGridjsStatTable(stat, colorList){
    let d = document.getElementById('stat-wrapper');
    d.innerHTML = '';
    const grid = new gridjs.Grid();
    grid.updateConfig({
        columns: [
            'col1',
            'col2',
            'col3'
        ],
        pagination: {
            limit: 10
        },
        data: function(){
            let i = 0;
            for(const v of stat){
                v.push(addColor(colorList[i], colorList[i]));
                i += 1;
            }
            return stat;
        },
        style: {
            td: {
                border: '1px solid #ccc'
            },
            table: {
                'font-size': '1em'
            }
        }
    });
    grid.render(d);
    grid.forceRender(d);
}

function addColor(text, rgb) {
    return gridjs.h('span', {
        style: {'background-color': rgb}
    }, text);
}

// Table with Gridjs library.
function showGridjsResultTable(result){
    let d = document.getElementById('result-wrapper');
    d.innerHTML = '';
    const grid = new gridjs.Grid();
    grid.updateConfig({
        columns: [
            'Address',
            'Status',
            'Country',
            'City',
            {
                name: 'Log',
                formatter: (cell, row) => {
                    return gridjs.h('span', {
                        className: 'button',
                        onClick: function(){
                            showPopup();
                            let popup = document.getElementById('popup-pad');
                            removeAllChild(popup);
                            let newText = document.createTextNode(cell.info);
                            popup.appendChild(newText);
                        }
                    }, cell.text);
                },
                sort: {
                    enabled: false
                }
            },
            {
                name: 'Whois',
                formatter: (cell, row) => {
                    return gridjs.h('span', {
                        className: 'button',
                        onClick: function(){
                            showPopup();
                            let popup = document.getElementById('popup-pad');
                            removeAllChild(popup);
                            if(cell.info === null){
                                getWhois(row.cells[0].data, cell, popup);
                            }
                            else{
                                removeAllChild(popup);
                                let newText = document.createTextNode(cell.info);
                                popup.appendChild(newText);
                            }
                        }
                    }, cell.text);
                },
                sort: {
                    enabled: false
                }
            },
            {
                name: 'Lookup',
                formatter: (cell, row) => {
                    return gridjs.h('span', {
                        className: 'button',
                        onClick: function(){
                            showPopup();
                            let popup = document.getElementById('popup-pad');
                            removeAllChild(popup);
                            if(cell.info === null){
                                getRevLookup(row.cells[0].data, cell, popup);
                            }
                            else{
                                removeAllChild(popup);
                                let newText = document.createTextNode(cell.info);
                                popup.appendChild(newText);
                            }
                        }
                    }, cell.text);
                },
                sort: {
                    enabled: false
                }
            },
        ],
        sort: true,
        search: {
            selector: function(cell, cellIndex){
                if(cell === null || cell.info === null){
                    return '';
                }
                else if(cellIndex == 4 || cellIndex == 5 || cellIndex == 6){
                    return '';
                }
                else{
                    return cell;
                }
            }
        },
        data:() => {
            return new Promise(resolve => {
                setTimeout(() =>
                resolve(result), 2000);
            });
        }
    });

    console.log('rendering')
    grid.render(d);
    console.log('done rendering')
    console.log('force rendering')
    grid.forceRender(d);
    console.log('done force rendering')
}
function getStat(result){
    var stat = new Object();
    for(const value of result){
        var country = value['country'];
        if (!stat.hasOwnProperty(country)){
            stat[country] = 0;
        }
        stat[country] += 1;
    }
    var statArray =  Object.entries(stat);
        statArray.sort(function(a, b){
        return b[1] - a[1];
        });
    return statArray;
}

function showPieChart(stat){
    var total = 0;
    for(const elem of stat){
        total += elem[1];
    }
    var canvas = document.getElementById('stat-chart');
    var ctx = canvas.getContext('2d')
    //arc(x, y, radius, startAngle, endAngle, anticlockwise)
    //radians = (Math.PI/180)*degrees
    startAngle = 0 - (Math.PI * 2 * (1 / 4));
    let colorList = new Array()
    for(const [country, n] of stat){
        endAngle = startAngle + Math.PI * 2 * (n / total);
        let color = getRandomColor();
        ctx.fillStyle = color;
        colorList.push(color)
        ctx.beginPath();
        ctx.moveTo(150, 100);
        ctx.arc(150, 100, 100, startAngle, endAngle, false);
        ctx.fill();
        startAngle = endAngle;
    }
    return colorList;
}

function getRevLookup(address, targetElement, outputElement){
    let requestURL = LOOKUP_API + address;
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    removeAllChild(outputElement);
    let newText = document.createTextNode('Now Loading..');
    outputElement.appendChild(newText);
    request.onload = function () {
        removeAllChild(outputElement);
        const result = request.response;
        console.log('DONE: ', request.status);
        targetElement.info = result;
        let newText = document.createTextNode(targetElement.info);
        outputElement.appendChild(newText);
    };
    request.send();
}

function getWhois(address, targetElement, outputElement){
    let requestURL = 'https://rdap.org/ip/' + address;
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    removeAllChild(outputElement);
    let newText = document.createTextNode('Now Loading..');
    outputElement.appendChild(newText);
    request.responseType = 'json';
    request.setRequestHeader('Accept', 'application/rdap+json');
    request.onload = function () {
        removeAllChild(outputElement);
        const result = request.response;
        console.log('DONE: ', request.status);
        targetElement.info = JSON.stringify(result, null, 4);
        let newText = document.createTextNode(targetElement.info);
        outputElement.appendChild(newText);
    };
    request.send();
}

function showPopup(){
    var popup = document.getElementById('popup');
    var y = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    popup.style.top = y+ 'px';
    popup.classList.remove('hide');
}

function getRandomColor(){
    return 'rgb(' + getRandomInt(255) + ',' + getRandomInt(255) + ',' + getRandomInt(255) + ')';
} 

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function removeAllChild(elem){
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

// Valilla table.
function showStatTable(stat){
    let tableRef = document.getElementById('stat-table');
    removeAllChild(tableRef);
    for(const row of stat){
        let newRow = tableRef.insertRow(-1);
        for(const e of row){
            let newCell = newRow.insertCell(-1);
            let newText = document.createTextNode(e);
            newCell.appendChild(newText);
            }
    }
}

// Valilla table
function showResultTable(result){
    let tableRef = document.getElementById('result-table');
    removeAllChild(tableRef);
    for(const value of result){
        let newRow = tableRef.insertRow(-1);
        for(const key of [value['address'], value['status'], value['country'], value['city'], 'log', 'whois']){
            if(key == 'log'){
                let newCell = addNewCell(newRow, key, [key, 'button'], value[key]);
                newCell.firstChild.addEventListener('click', function(e){
                    console.log(e.target);
                    console.log(e.target.parentNode);
                    showPopup();
                    let popup = document.getElementById('popup-pad');
                    removeAllChild(popup);
                    let newText = document.createTextNode(e.target.parentNode.info);
                    popup.appendChild(newText);
                });
            }
            else if(key == 'whois'){
                let newCell = addNewCell(newRow, key, [key, 'button'], value[key]);
                newCell.firstChild.addEventListener('click', function(e){
                    showPopup();
                    let pad = document.getElementById('popup-pad');
                    if(e.target.parentNode.info === null){
                        getWhois(addr, e.target.parentNode, pad);
                    }
                    else{
                        removeAllChild(pad);
                        let newText = document.createTextNode(e.target.parentNode.info);
                        pad.appendChild(newText);
                    }
                });
            }
            else{
                addNewCell(newRow, key);
            }
        }
    }
}

function addNewCell(rowRef, text, spanClass=null, cellProp=null){
    let newCell = rowRef.insertCell(-1);
    let newSpan = document.createElement('span');
    let newText = document.createTextNode(text);
    newSpan.info = cellProp;
    newSpan.appendChild(newText);
    newCell.appendChild(newSpan);
    if(spanClass !== null){
        for(const v of spanClass){
            newSpan.classList.add(v);
        }
    }
    return newCell;
}