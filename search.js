// add a result to an unordered list
function addResult(ul, typestr, url, title) {
  let li = document.createElement('li');
  li.textContent = "— " + typestr + ': ';
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  li.appendChild(a);
  ul.appendChild(li);
}

// call loadfunc on an botb API xmlhttprequest for the given endpoint
function searchEndpoint(endpoint, query, loadfunc) {
  let req = new XMLHttpRequest();
  //that if statement catches any errors.
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

// run when dom content loads
window.addEventListener('DOMContentLoaded', (event) => {
	
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
		document.getElementById('qinput').value = query;
		document.getElementById('qtype').value = qtype;
		document.getElementById('ftype').value = ftype;
		const results = document.getElementById('results');
	
	//if null default to name
		switch (qtype?qtype:"name") {
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
					req.response.forEach(e => addResult(results, 'Battle', e.url, e.title)));
			break;
		case "botbr":
			searchEndpoint('botbr/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'BotBr', e.profile_url, e.name)));
			break;
		case "entry":
			searchEndpoint('entry/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Entry', e.profile_url, e.title)));
			break;
		case "thread":
			searchEndpoint('group_thread/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title)));
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Lyceum', e.profile_url, e.title)));
			break;
		case "all":
		default:
			searchEndpoint('battle/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Battle', e.url, e.title)));
			searchEndpoint('botbr/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'BotBr', e.profile_url, e.name)));
			searchEndpoint('entry/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Entry', e.profile_url, e.title)));
			searchEndpoint('group_thread/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title)));
			searchEndpoint('lyceum_article/search/', query, (req) =>
				req.response.forEach(e => addResult(results, 'Lyceum', e.profile_url, e.title)));
			break;
	}
}
function searchByID(query,ftype,results) {
	//if null default to all
	switch (ftype?ftype:"all") {
		case "battle":
			searchEndpoint('battle/load/', query, (req) =>
				{addResult(results, 'Battle', req.response.url, req.response.title)});
			break;
		case "botbr":
			searchEndpoint('botbr/load/', query, (req) =>
				{addResult(results, 'BotBr', req.response.profile_url, req.response.name)});
			break;
		case "entry":
			searchEndpoint('entry/load/', query, (req) =>
				{addResult(results, 'Entry', req.response.profile_url, req.response.title)});
			break;
		case "thread":
			searchEndpoint('group_thread/load/', query, (req) =>
				{addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + req.response.id + '/', req.response.title)});
			break;
		case "lyceum":
			searchEndpoint('lyceum_article/load/', query, (req) =>
				{addResult(results, 'Lyceum', req.response.profile_url, req.response.title)});
			break;
		case "all":
		default:
			searchEndpoint('battle/load/', query, (req) =>
				{addResult(results, 'Battle', req.response.url, req.response.title)});
			searchEndpoint('botbr/load/', query, (req) =>
				{addResult(results, 'BotBr', req.response.profile_url, req.response.name)});
			searchEndpoint('entry/load/', query, (req) =>
				{addResult(results, 'Entry', req.response.profile_url, req.response.title)});
			searchEndpoint('group_thread/load/', query, (req) =>
				{addResult(results, 'Thread','https://battleofthebits.com/academy/GroupThread/' + req.response.id + '/', req.response.title)});
			searchEndpoint('lyceum_article/load/', query, (req) =>
				{addResult(results, 'Lyceum', req.response.profile_url, req.response.title)});
			searchEndpoint('palette/load/', query, (req) =>
				{addResult(results, 'Palette','https://battleofthebits.com/barracks/PaletteEditor/' + req.response.id + '/', req.response.title)});
			break;
	}
}