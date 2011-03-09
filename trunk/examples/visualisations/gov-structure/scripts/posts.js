/*

posts.js

Created by @danpaulsmith for the Government Structure 
visualisation.

2011

*/


$(document).ready(function() {

	//$("#infovis").width($(window).width()-140);
	//$("#infovis").height($(window).height()-71);
	
	$('div.about-tip').dialog({autoOpen:false, buttons: [
  		{
        	text: "Ok",
        	click: function() { $(this).dialog("close"); }
    	}
	], modal: true, position: 'center', title: 'About', resizable: false, width: 500, zIndex: 9999});
	
	// Breadcrumbs
	$(function() {
	    $( "button#gov" ).button({
	        text: true
	    });    
	    $( "button#dept" ).button({
	        text: true
	    });
	    $( "button#unit" ).button({
	        text: true,
	        disabled: true
	    });       
	});
	
	$( "a.aboutToggle").button().click(function() { $('div.about-tip').dialog('open'); return false;});
	

	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	$('div#right').children().css('visibility','visible');
	
	$("select#postType").val("Permanent Secretary");
	
	$("select#postType").change(function(){
		$("#infovis").css("visibility","hidden");
		init(param_dept,param_unit,$(this).val());
	});
	
	init(param_dept,param_unit,$("select#postType").val());
	
	
});

var api_call_info;

function init(pDept,pUnit,postType){
	
	deptParam = pDept;
	unitParam = pUnit;
	
	api_call_info = [];
	$('div#apiCalls').hide();
	$("a.source").remove();
	$('div.apiCall').remove();
		
	loadDepts(deptParam,unitParam,postType);
	
}

/*
 *
 */
function loadDepts(pDept,pUnit,postType) {
	
	showLog("Loading data ...");

	var postList = new Array();
	
	// Description of API call
	api_call_info.push({
		title:"Retrieve Permanent Secretary posts within department",
		description:"Asks for a list of all Permanent Secretary posts within a department.",
		url:"http://reference.data.gov.uk/doc/department/"+pDept+"/post",
		parameters:"?_pageSize=100&type.label="+postType.replace(" ","+")
	});	
	
	//api_call_info[0].url = "http://danpaulsmith.com/puelia3/doc/department.json?_view=minimal&_properties=unit.label,unit.post.label,unit.post.reportsTo&_pageSize=100"
	//alert("using danpaulsmith.com API");
	
	$.ajax({
		url: api_call_info[0].url+".json"+api_call_info[0].parameters+"&callback=?",
		type: "GET",
		dataType: "jsonp",
		async:true,
		success: function(json){
			
			var html="";
						
			for(var i=0;i<json.result.items.length;i++){
			
				var slug = json.result.items[i]._about.split("/");
				slug = slug[slug.length-1];
				
				html += '<div class="post" rel="'+slug+'">';
				
				var label = json.result.items[i].label[0];
				html += '<h3 class="label">'+label+'</h3>';
				html += '<div class="image"><img width="130" src="../images/no_profile.jpg" /></div>';

				var name = json.result.items[i].heldBy[0].name;
				if(typeof name != 'undefined'){
					html += '<p class="name ui-state-hover">'+name+'</p>';
				} else {
					html += '<p class="name ui-state-hover">?</p>';				
				}
				html += '<p class="comment">'+comment+'</p>';

				html += '<table>';

				if(typeof json.result.items[i].heldBy[0].email != 'undefined'){
					var email = json.result.items[i].heldBy[0].email.label[0];
					//html += '<tr class="email odd"><td class="label">Email</td><td>'+email+'</td></tr>';
				}
				if(typeof json.result.items[i].heldBy[0].phone != 'undefined'){
					var phone = json.result.items[i].heldBy[0].phone.label[0];
					//html += '<tr class="phone even"><td class="label">Phone</td><td>'+phone+'</td></tr>';
				}
				var unit = json.result.items[i].postIn[0].label[0]; // handle
				html += '<tr class="unit odd"><td class="label">Unit</td><td>'+unit+'</td></tr>';

				var dept = json.result.items[i].postIn[1].label[0]; // handle
				html += '<tr class="dept even"><td class="label">Department</td><td>'+dept+'</td></tr>';

				try{
					var type = json.result.items[i].type[0].label[0];
					html += '<tr class="type odd"><td class="label">Type</td><td>'+type+'</td></tr>';
				}catch(e){}
				
				var comment = json.result.items[i].comment;
				
				try{
					var reportsTo = json.result.items[i].reportsTo[0].heldBy[0].name;
					html += '<tr class="reportsTo even end"><td class="label">Reports to</td><td>'+reportsTo+'</td></tr>';
				}catch(e){}			
				
				html += '</table>';
				
				html += '</div>';
			}
			
			
			
			$("#infovis").html(html);
			
			$("div.post").click(function(){
				window.location = "../organogram?dept="+pDept+"&post="+$(this).attr("rel");
			});
			
			//$("div.post").dropShadow();
			
			$("#infovis").css("visibility","visible");
									
			displayDataSources();
			
			hideLog();
		}
	});
}


function displayDataSources() {
	
	var html='<p class="label">Data sources</p>';
	
	for(var i=0;i<api_call_info.length;i++){
		
		html += '<a class="source">'+(i+1)+'</a>';
		
		html += '<div class="apiCall shadowBox">';
		
		html += '<p class="title"><span>API call '+(i+1)+':</span>'+api_call_info[i].title+'</p>';
		html += '<p class="description"><span>Description:</span>'+api_call_info[i].description+'</p>';
		html += '<p class="url"><span>URL:</span><a href="'+api_call_info[i].url+'.html" target="_blank">'+api_call_info[i].url+'</a></p>';	
		
		html += '<p class="params"><span>Parameters:</span></p>';
		
		var tempParams = api_call_info[i].parameters.replace("?","").split("&");
		
		html += '<ul class="paramlist">';
		for(var j=0;j<tempParams.length;j++){
			html+= '<li>'+tempParams[j]+'</li>';
		}
		html += '</ul>';
		
		html += '<p class="formats"><span>Formats:</span>';
		html += '<a href="'+api_call_info[i].url+'.rdf'+api_call_info[i].parameters+'" target="_blank">RDF</a>';
		html += '<a href="'+api_call_info[i].url+'.ttl'+api_call_info[i].parameters+'" target="_blank">TTL</a>';
		html += '<a href="'+api_call_info[i].url+'.xml'+api_call_info[i].parameters+'" target="_blank">XML</a>';
		html += '<a href="'+api_call_info[i].url+'.json'+api_call_info[i].parameters+'" target="_blank">JSON</a>';
		html += '<a href="'+api_call_info[i].url+'.html'+api_call_info[i].parameters+'" target="_blank">HTML</a>';
		html += '</p>';
		html += '<a class="close">x</a>';
		html += '</div><!-- end apiCall -->';
		
	}
	
	//$('div#apiCalls').html($('div#apiCalls').html()+html);
	$('div#apiCalls').html(html);
	
	$('div#apiCalls a.source').each(function(){
		$(this).button({text:true}).toggle(function() { $(this).next('div.apiCall').show();return false; },function(){$('div.apiCall').hide();return false;});
	});
	
	$('p.formats a').each(function(){
		$(this).button({text:true});
	});
	
	resetSourceLinks();
	
	$('div#apiCalls').fadeIn();
		
	return false;
}

function showLog(string){
	$("#log img").show();
	$("#log span").html(string);
	$("#log").fadeIn();
	return false;
}
function changeLog(string, showImg){
	$("#log span").html(string);
	if(showImg){

	}else {
		$("#log img").hide();
	}
	return false;
}
function hideLog() {
	setTimeout(function() {
		$("#log").fadeOut();
	},1000);
	return false;	
}
function resetSourceLinks() {
	
	$("div#apiCalls a.source").click(function(){
		$("div#apiCalls div.apiCall").hide();
		$(this).next().fadeIn();
	});
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});
		
	return false;
}