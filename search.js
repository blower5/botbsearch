let STATUS_MAP = new Map();

// add a result to an unordered list
function addResult(tbody, typestr, format, url, title, extrainfo, datetime) {
	let tr = document.createElement('tr');
	let tdtype = document.createElement('td');
	let tdicon = document.createElement('td');
	let tdname = document.createElement('td');
	let tddate = document.createElement('td');
	let tdinfo = document.createElement('td');
	
	//— <- this is an em dash. I don't know how to type it so I'm putting it here for later
	tdtype.textContent = typestr;
	
	//Probably somewhat poorly named, the format parameter controls the icon, and changes based
	//on what kind of result was recieved. Threads pass their group id and not their name, as
	//not all of their icons match their name, and I felt like a mapping based on id was simpler
	//than a mapping based on group name. For entries and battles, which use the default case here,
	//the format parameter is actually their format. Battles with more than one use the string
	//">1". BotBr's pass their class. Which, as a side note, I didn't know you were even allowed to
	//use a key called "class".
	
	if (format == ">1") {
		tdicon.textContent = ">1";
		tdicon.title = "More than one format";
	} else {
		let formaticondiv = document.createElement('div');
		switch (typestr) {
			case "Playlist":
				formaticondiv.className = "botb-icon icons-list";
				formaticondiv.title = "Playlist";
				break;
			case "Lyceum":
				formaticondiv.className = "botb-icon icons-lyceum";
				formaticondiv.title = "Lyceum Article";
				break;
			case "BotBr":
				formaticondiv.className = "botb-icon icons-" + format.toLowerCase();
				formaticondiv.title = format;
				break;
			case "Thread":
				formaticondiv.className = "botb-icon " + getThreadGroupIcon(format);
				formaticondiv.title = getThreadGroupName(format);
				break;
			default:
				formaticondiv.className = "botb-icon icons-formats-" + format.toLowerCase();
				formaticondiv.title = format;
				break;
		}
		tdicon.appendChild(formaticondiv);
	}
	
	let a = document.createElement('a');
	a.href = url;
	a.textContent = title;
	tdname.appendChild(a);
	
	tddate.textContent = datetime.slice(0,10);	
	
	tdinfo.textContent = extrainfo;
	tdinfo.className = "rightinfo";

	tr.appendChild(tdtype);
	tr.appendChild(tdicon);
	tr.appendChild(tdname);
	tr.appendChild(tddate);
	tr.appendChild(tdinfo);

	tbody.appendChild(tr);
	
	//update tablesorter, do not re-sort
	$.tablesorter.updateAll( $(".tablesorter")[0].config, false);
}

function setStatus(typestr, status) {
	STATUS_MAP.set(typestr, status);
	let p = document.querySelector('#status');
	let vs = [...STATUS_MAP.values()];
	if (vs.includes('waiting')) {
		p.textContent = 'Searching.';
		vs.forEach( e => {
				if (e == "done") p.textContent = p.textContent + "." //loading bar effect
		})
	} else if (vs.includes('error')) {
		p.textContent = 'API error!';
	} else {
		p.textContent = 'Done!';
	}
}

// call loadfunc on an botb API xmlhttprequest for the given endpoint
function searchEndpoint(endpoint, query, typestr, loadfunc) {
	setStatus(typestr, 'waiting');
	fetch('https://battleofthebits.com/api/v1/' + endpoint + encodeURIComponent(query.trim()))
		.then(response => {
			setStatus(typestr, 'done');
			response.json().then(loadfunc);
		})
		.catch(error => {
			setStatus(typestr, 'error');
		});
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
	if (id == id.match(/[0-9]+/)[0]) { //pass numbers only
		let palettereq = new XMLHttpRequest();
		palettereq.addEventListener('load', (event) => setPaletteCookies(palettereq));
		palettereq.open('GET', 'https://battleofthebits.com/api/v1/palette/load/' + encodeURIComponent(id));
		palettereq.responseType = 'json';
		palettereq.send();
	}
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

function updateSpritesheet() {
	let spritesheetidreq = new XMLHttpRequest();
	spritesheetidreq.addEventListener('load', (event) => {
		let spritesheetversion = spritesheetidreq.response.spriteshit_version;
		$('<link/>', {rel: 'stylesheet', href: "https://battleofthebits.com/styles/spriteshit/"+spritesheetversion+".css"}).appendTo('head');
	});
	spritesheetidreq.open('GET', 'https://battleofthebits.com/api/v1/spriteshit/version/');
	spritesheetidreq.responseType = 'json';
	spritesheetidreq.send();
}


const grouplist = ["???","Bulletins","News","???","Entries","Battles","Photos","Updates","n00b s0z","mail","Bugs/Features","Smeesh","Project Dev","BotBrs","Lyceum"];
function getThreadGroupName(groupnumber) {
	let groupname = grouplist[groupnumber];
	groupname ??= "???";
	//if groupname doesn't exist return with question marks
	return groupname;
}

const groupiconlist = ["","bulletins","news","","entries","battles","","updates","n00b","","bug","","updates","botbrs","lyceum"];
function getThreadGroupIcon(groupnumber) {
	let groupicon = groupiconlist[groupnumber];
	if (groupicon) {
		return "icons-" + groupicon;
	}
	return "";
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
	return "\u00A0Δ"; //00A0 is a non-breaking space
}

function formatBattleFormat(formats) {
	if (formats.length == 1) return formats[0];
	return ">1";
}

//takes an input of seconds and formats it nicely 
function formatRuntime(runtime) {
	runtimeHours = Math.floor(runtime/3600);
	runtimeMinutes = Math.floor(runtime/60) % 60;
	runtimeSeconds = runtime%60;
	return runtimeHours + ":" + runtimeMinutes.toString().padStart(2,"0") + ":" + runtimeSeconds.toString().padStart(2,"0");
}

// run when dom content loads
window.addEventListener('DOMContentLoaded', (event) => {
	//initialize table sorter
	$(".tablesorter").tablesorter({
		theme: 'dark',
		ignoreCase : true,
		sortStable : true
	});
	
	//fetch newest spritesheet version and add stylesheet
	updateSpritesheet();
	
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
		const qtypeSearchParams = new URLSearchParams(window.location.search).get('qtype');
		const ftypeSearchParams = new URLSearchParams(window.location.search).get('ftype');
		
		//null cases
		const qtype = qtypeSearchParams ?? "name";
		const ftype = ftypeSearchParams ?? "all";
		
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
	switch (ftype) {
		case "battle":
			searchEndpoint('battle/search/', query, 'Battle', (data) =>
				data.forEach(e => addResult(results, 'Battle' + formatBattleType(e.type), formatBattleFormat(e.format_tokens), e.url, e.title, e.entry_count+" Entries", e.start)));
			break;
		case "botbr":
			searchEndpoint('botbr/search/', query, 'BotBr', (data) =>
				data.forEach(e => addResult(results, 'BotBr', e.class, e.profile_url, e.name, "Lvl "+e.level+" "+e.class, e.create_date)));
			break;
		case "entry":
			searchEndpoint('entry/search/', query, 'Entry', (data) =>
				data.forEach(e => addResult(results, 'Entry', e.format_token, e.profile_url, e.title, formatEntryScore(e.score,e.favs), e.datetime)));
			break;
		case "playlist":
			searchEndpoint('playlist/search/', query, 'Playlist', (data) =>
				data.forEach(e => addResult(results, 'Playlist', "", 'https://battleofthebits.com/playlist/View/' + e.id + '/', e.title, e.count+" Items | " + formatRuntime(e.runtime), e.date_create.slice(0,-8))));
			break;
		case "thread":
			searchEndpoint('group_thread/search/', query, 'Thread', (data) =>
				data.forEach(e => addResult(results, 'Thread', e.group_id, 'https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title, "In " + getThreadGroupName(e.group_id), e.first_post_timestamp)));
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/search/', query, 'Lyceum', (data) =>
				data.forEach(e => addResult(results, 'Lyceum', "",  e.profile_url, e.title, e.views + " Views", "---")));
			break;
		case "all":
		default:
			searchEndpoint('battle/search/', query, 'Battle', (data) =>
				data.forEach(e => addResult(results, 'Battle' + formatBattleType(e.type), formatBattleFormat(e.format_tokens), e.url, e.title, e.entry_count+" Entries", e.start)));
			searchEndpoint('botbr/search/', query, 'BotBr', (data) =>
				data.forEach(e => addResult(results, 'BotBr', e.class, e.profile_url, e.name, "Lvl "+e.level+" "+e.class, e.create_date)));
			searchEndpoint('entry/search/', query, 'Entry', (data) =>
				data.forEach(e => addResult(results, 'Entry', e.format_token, e.profile_url, e.title, formatEntryScore(e.score,e.favs), e.datetime)));
			searchEndpoint('playlist/search/', query, 'Playlist', (data) =>
				data.forEach(e => addResult(results, 'Playlist', "", 'https://battleofthebits.com/playlist/View/' + e.id + '/', e.title, e.count+" Items | " + formatRuntime(e.runtime), e.date_create.slice(0,-8))));
			searchEndpoint('group_thread/search/', query, 'Thread', (data) =>
				data.forEach(e => addResult(results, 'Thread', e.group_id, 'https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title, "In " + getThreadGroupName(e.group_id), e.first_post_timestamp)));
			searchEndpoint('lyceum_article/search/', query, 'Lyceum', (data) =>
				data.forEach(e => addResult(results, 'Lyceum', "", e.profile_url, e.title, e.views + " Views", "---")));
			break;
	}
}
function searchByID(query,ftype,results) {
	switch (ftype) {
		case "battle":
			searchEndpoint('battle/load/', query, 'Battle', (data) =>
				{addResult(results, 'Battle' + formatBattleType(data.type), formatBattleFormat(data.format_tokens), data.url, data.title, data.entry_count+" Entries", data.start)});
			break;
		case "botbr":
			searchEndpoint('botbr/load/', query, 'BotBr', (data) =>
				{addResult(results, 'BotBr', data.class, data.profile_url, data.name, "Lvl "+data.level+" "+data.class, data.create_date)});
			break;
		case "entry":
			searchEndpoint('entry/load/', query, 'Entry', (data) =>
				{addResult(results, 'Entry', data.format_token, data.profile_url, data.title, formatEntryScore(data.score,data.favs), data.datetime)});
			break;
		case "playlist":
			searchEndpoint('playlist/load/', query, 'Playlist', (data) =>
				{addResult(results, 'Playlist', '', 'https://battleofthebits.com/playlist/View/' + data.id + '/', data.title, data.count+" Items | " + formatRuntime(data.runtime), data.date_create.slice(0,-8))});
			break;
		case "thread":
			searchEndpoint('group_thread/load/', query, 'Thread', (data) =>
				{addResult(results, 'Thread', data.group_id, 'https://battleofthebits.com/academy/GroupThread/' + data.id + '/', data.title, "In " + getThreadGroupName(data.group_id), data.first_post_timestamp)});
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/load/', query, 'Lyceum', (data) =>
				{addResult(results, 'Lyceum', '', data.profile_url, data.title, data.views + " Views", "---")});
			break;
		case "all":
		default:
			searchEndpoint('battle/load/', query, 'Battle', (data) =>
				{addResult(results, 'Battle' + formatBattleType(data.type), formatBattleFormat(data.format_tokens), data.url, data.title, data.entry_count+" Entries", data.start)});
			searchEndpoint('botbr/load/', query, 'BotBr', (data) =>
				{addResult(results, 'BotBr', data.class, data.profile_url, data.name, "Lvl "+data.level+" "+data.class, data.create_date)});
			searchEndpoint('entry/load/', query, 'Entry', (data) =>
				{addResult(results, 'Entry', data.format_token, data.profile_url, data.title, formatEntryScore(data.score,data.favs), data.datetime)});
			searchEndpoint('group_thread/load/', query, 'Thread', (data) =>
				{addResult(results, 'Thread', data.group_id, 'https://battleofthebits.com/academy/GroupThread/' + data.id + '/', data.title, "In " + getThreadGroupName(data.group_id), data.first_post_timestamp)});
			searchEndpoint('playlist/load/', query, 'Playlist', (data) =>
				{addResult(results, 'Playlist', '', 'https://battleofthebits.com/playlist/View/' + data.id + '/', data.title, data.count+" Items | " + formatRuntime(data.runtime), data.date_create.slice(0,-8))});
			searchEndpoint('lyceum_article/load/', query, 'Lyceum', (data) =>
				{addResult(results, 'Lyceum', '', data.profile_url, data.title, data.views + " Views", "---")});
			searchEndpoint('palette/load/', query, 'Palette', (data) =>
				{addResult(results, 'Palette', '', 'https://battleofthebits.com/barracks/PaletteEditor/' + data.id + '/', data.title, "---", "---")});
			break;
	}
}