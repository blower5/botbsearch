// add a result to an unordered list
function addResult(tbody, typestr, url, title, extrainfo, datetime) {
  let tr = document.createElement('tr');
  let tdtype = document.createElement('td');
  let tdname = document.createElement('td');
  let tddate = document.createElement('td');
  let tdinfo = document.createElement('td');
  
  //create left cell of row (type and name)
  //— <- this is an em dash. I don't know how to type it so I'm putting it here for later
  tdtype.textContent = typestr;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  tdname.appendChild(a);
  
  tddate.textContent = datetime.slice(0,10);	
  
  tdinfo.textContent = extrainfo;
  tdinfo.className = "rightinfo";

  tr.appendChild(tdtype);
  tr.appendChild(tdname);
  tr.appendChild(tddate);
  tr.appendChild(tdinfo);

  tbody.appendChild(tr);
  
  //update tablesorter, do not re-sort
  $.tablesorter.updateAll( $(".tablesorter")[0].config, false);
}

// call loadfunc on an botb API xmlhttprequest for the given endpoint
function searchEndpoint(endpoint, query, loadfunc) {
  let req = new XMLHttpRequest();
  //this if statement catches any errors
  req.addEventListener('load', (event) => {if (!req.response.response_type) loadfunc(req)});
  req.open('GET', 'https://battleofthebits.com/api/v1/' + endpoint + encodeURIComponent(query));
  req.responseType = 'json';
  req.send();
}

//I have no clue how the textshadow color is actually calculated. this function gets passed color1 and returns an altered version
function getTextShadow(hex) {
	var rgb = [hex.slice(0,2),hex.slice(2,4),hex.slice(4,6)];
	for (i in rgb) {
		rgb[i] = Math.round( parseInt(rgb[i],16)*.4+21 ).toString(16);
	}
	return rgb[0]+rgb[1]+rgb[2];
}

//update palette cookies
function updatePalette(id) {
	let palettereq = new XMLHttpRequest();
	palettereq.addEventListener('load', (event) => setPaletteCookies(palettereq));
	palettereq.open('GET', 'https://battleofthebits.com/api/v1/palette/load/' + encodeURIComponent(id));
	palettereq.responseType = 'json';
	palettereq.send();
}

//return value for a cookie's name
function getCookie(name){
    var pattern = RegExp(name + "=.[^;]*")
    var matched = document.cookie.match(pattern)
    if(matched){
        var cookie = matched[0].split('=')
        return cookie[1]
    }
    return false
}

//synthesize a big hex number of all the hexcodes concatenated and store
function setPaletteCookies(botbpalette) {
	let r = botbpalette.response;
	document.cookie = "palette="+r.color1+r.color2+r.color3+r.color4+r.color5+";max-age=31536000;SameSite=Strict";
	location.reload()
}

grouplist = ["???","Bulletins","News","???","Entries","Battles","Photos","Updates","n00b s0z","mail","Bugs/Features","Smeesh","Project Dev","BotBrs","Lyceum"];
function getThreadGroupName(groupnumber) {
	groupname = grouplist[groupnumber];
	groupname ??= "???";
	//if groupname doesn't exist return with question marks
	return "In " + groupname;
}

function formatEntryScore(score,favs) {
	if (score == null) return "?.? Scofavs"
	return (parseFloat(score) + parseInt(favs)).toFixed(1) + " Scofavs";
}

function formatBattleType(type) {
	//note for later: I have no clue what the battle types actually mean.
	//It seems all XHBs are type 3 but majors can be type 1 or 0... one of
	//the advent calendars was type 25?
	if (type == 3) return ""
	return " Δ";
}

// run when dom content loads
window.addEventListener('DOMContentLoaded', (event) => {
	//initialize table sorter
	$(".tablesorter").tablesorter({
		theme: 'dark',
		ignoreCase : true,
		sortStable : true
	});
	
	// ----------------------------------------------------------------------------------------------------------
	//    palette control
	//
	var storedPalette = getCookie("palette");
	if (storedPalette) {
		document.documentElement.style.cssText = "--color1: #"+storedPalette.slice(0,6)+
		"; --color2: #"+storedPalette.slice(6,12)+
		"; --color3: #"+storedPalette.slice(12,18)+
		"; --color4: #"+storedPalette.slice(18,24)+
		"cc; --color5: #"+storedPalette.slice(24,30)+
		"; --textshadow: #"+getTextShadow(storedPalette.slice(0,6))+";";
	}
	
	//run on enter key in palette text input
	var paletteinput = document.getElementById('pinput');
	paletteinput.addEventListener('change', (event) => {
		updatePalette(paletteinput.value);
	});
	// ----------------------------------------------------------------------------------------------------------

	const query = new URLSearchParams(window.location.search).get('q');
	if (query) {
		const qtype = new URLSearchParams(window.location.search).get('qtype');
		const ftype = new URLSearchParams(window.location.search).get('ftype');
		
		//null cases
		qtype ??= "name";
		ftype ??= "all";
		
		document.getElementById('qinput').value = query;
		document.getElementById('qtype').value = qtype;
		document.getElementById('ftype').value = ftype;
		const results = document.getElementById('results');
		
		switch (qtype) {
			case "name":
			default:
				searchByName(query,ftype,results);
				break;
			case "id":
				searchByID(query,ftype,results);
				break;
		}
	}
});

function searchByName(query,ftype,results) {
	//if null default to all
	switch (ftype?ftype:"all") {
		case "battle":
			searchEndpoint('battle/search/', query, (req) =>
					req.response.forEach(e => addResult(results, 'Battle' + formatBattleType(e.type), e.url, e.title, e.entry_count+" Entries", e.start)));
			break;
		case "botbr":
			searchEndpoint('botbr/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'BotBr', e.profile_url, e.name, "Lvl "+e.level, e.create_date)));
			break;
		case "entry":
			searchEndpoint('entry/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Entry', e.profile_url, e.title, formatEntryScore(e.score,e.favs), e.datetime)));
			break;
		case "thread":
			searchEndpoint('group_thread/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title, getThreadGroupName(e.group_id), e.first_post_timestamp)));
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Lyceum', e.profile_url, e.title, e.views + " Views", "---")));
			break;
		case "all":
		default:
			searchEndpoint('battle/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Battle' + formatBattleType(e.type), e.url, e.title, e.entry_count+" Entries", e.start)));
			searchEndpoint('botbr/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'BotBr', e.profile_url, e.name, "Lvl "+e.level, e.create_date)));
			searchEndpoint('entry/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Entry', e.profile_url, e.title, formatEntryScore(e.score,e.favs), e.datetime)));
			searchEndpoint('group_thread/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title, getThreadGroupName(e.group_id), e.first_post_timestamp)));
			searchEndpoint('lyceum_article/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Lyceum', e.profile_url, e.title, e.views + " Views", "---")));
			break;
	}
}
function searchByID(query,ftype,results) {
	//if null default to all
	switch (ftype?ftype:"all") {
		case "battle":
			searchEndpoint('battle/load/', query, (req) =>
				{addResult(results, 'Battle' + formatBattleType(req.response.type), req.response.url, req.response.title, req.response.entry_count+" Entries", req.response.start)});
			break;
		case "botbr":
			searchEndpoint('botbr/load/', query, (req) =>
				{addResult(results, 'BotBr', req.response.profile_url, req.response.name, "Lvl "+req.response.level, req.response.create_date)});
			break;
		case "entry":
			searchEndpoint('entry/load/', query, (req) =>
				{addResult(results, 'Entry', req.response.profile_url, req.response.title, formatEntryScore(req.response.score,req.response.favs), req.response.datetime)});
			break;
		case "thread":
			searchEndpoint('group_thread/load/', query, (req) =>
				{addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + req.response.id + '/', req.response.title, getThreadGroupName(req.response.group_id), req.response.first_post_timestamp)});
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/load/', query, (req) =>
				{addResult(results, 'Lyceum', req.response.profile_url, req.response.title, req.response.views + " Views", "---")});
			break;
		case "all":
		default:
			searchEndpoint('battle/load/', query, (req) =>
				{addResult(results, 'Battle' + formatBattleType(req.response.type), req.response.url, req.response.title, req.response.entry_count+" Entries", req.response.start)});
			searchEndpoint('botbr/load/', query, (req) =>
				{addResult(results, 'BotBr', req.response.profile_url, req.response.name, "Lvl "+req.response.level, req.response.create_date)});
			searchEndpoint('entry/load/', query, (req) =>
				{addResult(results, 'Entry', req.response.profile_url, req.response.title, formatEntryScore(req.response.score,req.response.favs), req.response.datetime)});
			searchEndpoint('group_thread/load/', query, (req) =>
				{addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + req.response.id + '/', req.response.title, getThreadGroupName(req.response.group_id), req.response.first_post_timestamp)});
			searchEndpoint('lyceum_article/load/', query, (req) =>
				{addResult(results, 'Lyceum', req.response.profile_url, req.response.title, req.response.views + " Views", "---")});
			searchEndpoint('palette/load/', query, (req) =>
				{addResult(results, 'Palette','https://battleofthebits.com/barracks/PaletteEditor/' + req.response.id + '/', req.response.title, "---", "---")});
			break;
	}
}