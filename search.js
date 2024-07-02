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
  req.addEventListener('load', (event) => loadfunc(req));
  req.open('GET', 'https://battleofthebits.com/api/v1/' + endpoint + encodeURIComponent(query));
  req.responseType = 'json';
  req.send();
}

//update palette cookies
function updatePalette(id) {
	let palettereq = new XMLHttpRequest();
	palettereq.addEventListener('load', (event) => setPaletteCookies(palettereq));
	palettereq.open('GET', 'https://battleofthebits.com/api/v1/palette/load/' + encodeURIComponent(id));
	palettereq.responseType = 'json';
	palettereq.send();
}

function getCookie(name){
    var pattern = RegExp(name + "=.[^;]*")
    var matched = document.cookie.match(pattern)
    if(matched){
        var cookie = matched[0].split('=')
        return cookie[1]
    }
    return false
}

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
		"cc; --color5: #"+storedPalette.slice(24,30)+";";
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
	
	const qinput = document.getElementById('qinput');
	qinput.value = query;
	const qdropdown = document.getElementById('qtype');
	qdropdown.value = qtype;
	const results = document.getElementById('results');
	
	//if null default to name
	switch (qtype?qtype:"name") {
	  
	  case "name":
		searchEndpoint('battle/search/', query, (req) =>
		  req.response.forEach(e => addResult(results, 'Battle', e.url, e.title)));
		searchEndpoint('botbr/search/', query, (req) =>
		  req.response.forEach(e => addResult(results, 'BotBr', e.profile_url, e.name)));
		searchEndpoint('entry/search/', query, (req) =>
		  req.response.forEach(e => addResult(results, 'Entry', e.profile_url, e.title)));
		searchEndpoint('group_thread/search/', query, (req) =>
		  req.response.forEach(e => addResult(results, 'Thread',
			'https://battleofthebits.com/academy/GroupThread/' + e.id + '/', e.title)));
		searchEndpoint('lyceum_article/search/', query, (req) =>
		  req.response.forEach(e => addResult(results, 'Lyceum', e.profile_url, e.title)));
		break;
		
	  case "id":
		searchEndpoint('battle/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'Battle', req.response.url, req.response.title)});
		searchEndpoint('botbr/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'BotBr', req.response.profile_url, req.response.name)});
		searchEndpoint('entry/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'Entry', req.response.profile_url, req.response.title)});
		searchEndpoint('group_thread/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'Thread',
		  'https://battleofthebits.com/academy/GroupThread/' + req.response.id + '/', req.response.title)});
		searchEndpoint('lyceum_article/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'Lyceum', req.response.profile_url, req.response.title)});
		searchEndpoint('palette/load/', query, (req) =>
		  {if (!req.response.response_type) addResult(results, 'Palette', 
		  'https://battleofthebits.com/barracks/PaletteEditor/' + req.response.id + '/', req.response.title)});
		break;
	}
  }
});