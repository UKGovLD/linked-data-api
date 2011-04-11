/*

post-list.js

Created by @danpaulsmith for the Government Structure 
visualisation.

2011

*/

var PostList = {
	vars:{
		dept:"",
		unit:"",
		postType:"",
		grade:"",
		previewMode:false,		// Used to initialise authentication and to swap API locations
		apiCallInfo:{
			postTypeList:{},
			gradeList:{}
		},
		debug:true,
		apiBase:"http://reference.data.gov.uk"
	},
	init:function(pDept,pUnit,pType,pGrade,pMode){
	
		if(pMode == "clear"){
			$.cookie("organogram-preview-mode", null);
			$.cookie("organogram-username", null);
			$.cookie("organogram-password", null);
		}

		log('$.cookie("organogram-preview-mode"):'+$.cookie("organogram-preview-mode"));
		log(pMode);

		// Check for preview parameter
		if(pMode == "true"){
			log("Param: In preview mode");
			// In preview mode
			
			/*
			if($.cookie("organogram-preview-mode") == "true") {
				// Already authenticated
				Orgvis.vars.previewMode = pMode;
				Orgvis.vars.apiBase = "organogram.data.gov.uk";
			} else {
				// Ask for username and pass
				Orgvis.showLogin();
			}
			*/
			PostList.vars.apiBase = "organogram.data.gov.uk";
			$("h1.title span#previewModeSign").show();		
		} else if($.cookie("organogram-preview-mode")) {
			log("Cookie: In preview mode");
			// In preview mode
			PostList.vars.apiBase = "organogram.data.gov.uk";
			$("h1.title span#previewModeSign").show();		
		} else {
			log("Not in preview mode");
			// Not in preview mode
			PostList.vars.apiBase = "reference.data.gov.uk";
		}
				
		PostList.vars.dept = pDept;
		PostList.vars.unit = pUnit;
		PostList.vars.postType = pType;
		PostList.vars.grade = pGrade;
		
		if(PostList.vars.postType.length > 0){
			$("select#loadBy").val(PostList.vars.postType.replace("+"," "));
			PostList.getPostsByType();
		} else if (PostList.vars.grade.length > 0) {
			$("select#loadBy").val(PostList.vars.grade.replace("+"," "));
			PostList.getPostsByGrade();
		} else {
			PostList.vars.postType = $("select#loadBy").val();
			PostList.getPostsByType();
		}





		$('div#apiCalls').hide();
		$("a.source").remove();
		$('div.apiCall').remove();
				
	},
	getPostsByType:function(){

		PostList.showLog("Loading data ...");

		PostList.vars.apiCallInfo.postTypeList = {
			title:"Posts by type",
			description:"Retrieves posts within department by their type.",
			url:"http://"+PostList.vars.apiBase+"/doc/department/"+PostList.vars.dept+"/post",
			parameters:"?_pageSize=100&type.label="+PostList.vars.postType.replace(" ","+")
		};
		
		$.ajax({
			url: PostList.vars.apiCallInfo.postTypeList.url+".json"+PostList.vars.apiCallInfo.postTypeList.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			success: function(json){	
				previewMode = true;
				PostList.loadDepts(json);
			},
			error: function(){
				PostList.changeLog("Error loading data",false);
			}
		});	
	},
	getPostsByGrade:function(){

		PostList.showLog("Loading data ...");

		PostList.vars.apiCallInfo.gradeList = {
			title:"Posts by grade",
			description:"Retrieve posts within a department by a specific grade.",
			url:"http://"+PostList.vars.apiBase+"/doc/department/"+PostList.vars.dept+"/post",
			parameters:"?_pageSize=100&grade="+PostList.vars.grade.replace(" ","+")
		};
		
		$.ajax({
			url: PostList.vars.apiCallInfo.gradeList.url+".json"+PostList.vars.apiCallInfo.gradeList.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			success: function(json){	
				previewMode=true;
				PostList.loadDepts(json);
			},
			error: function(){
				PostList.changeLog("Error loading data",false);
			}
		});	
	},	
	loadDepts:function(json){
	
		//var postList = new Array();
			
		var html='', slug, label, name, comment, email, phone, unit, dept, type, reportsTo, grade, salaryRange;
					
		for(var i=0,itemLength=json.result.items.length;i<itemLength;i++){
		
			slug = json.result.items[i]._about.split("/");
			slug = slug[slug.length-1];
			
			html += '<div class="post" rel="'+slug+'" data-id="id-'+slug+'">';
						
			try{
				label = json.result.items[i].label[0];
			}catch(e){}
			if(typeof label != 'undefined'){
				html += '<h3 class="label" data-type="title">'+label+'</h3>';
			} else {
				html += '<h3 class="label" data-type="title">?</h3>';						
			}			
						
			html += '<div class="image"><img width="130" src="../images/no_profile.jpg" /></div>';
			
			try{
				name = json.result.items[i].heldBy[0].name;
			}catch(e){}
			if(typeof name != 'undefined'){
				html += '<p class="name ui-state-hover" data-type="name">'+name+'</p>';
			} else {
				html += '<p class="name ui-state-hover" data-type="name">?</p>';
			}

			try{
				comment = json.result.items[i].comment;		
			}catch(e){}
			if(typeof comment != 'undefined'){
				//html += '<p class="comment">'+comment+'</p>';
			} else {
			}

			html += '<table>';
			

			try{
				email = json.result.items[i].heldBy[0].email.label[0];
			}catch(e){}
			if(typeof email != 'undefined'){
				//html += '<tr class="email odd"><td class="label">Email</td><td>'+email+'</td></tr>';
			} else {
				//html += '<tr class="email odd"><td class="label">Email</td><td>'+email+'</td></tr>';
			}			

			try{
				phone = json.result.items[i].heldBy[0].phone.label[0];
			}catch(e){}
			if(typeof phone != 'undefined'){
				//html += '<tr class="phone even"><td class="label">Phone</td><td>'+phone+'</td></tr>';
			} else {
				//html += '<tr class="phone even"><td class="label">Phone</td><td>'+phone+'</td></tr>';
			}	
						

			try{
				unit = json.result.items[i].postIn[0].label[0];
			}catch(e){}
			if(typeof unit != 'undefined'){
				html += '<tr class="unit odd"><td class="label">Unit</td><td data-type="unit">'+unit+'</td></tr>';
			} else {
				html += '<tr class="unit odd"><td class="label">Unit</td><td data-type="unit">?</td></tr>';
			}	
			
			try{
				dept = json.result.items[i].postIn[1].label[0];
			}catch(e){}
			if(typeof dept != 'undefined'){
				//html += '<tr class="dept even"><td class="label">Department</td><td data-type="dept">'+dept+'</td></tr>';
			} else {
				//html += '<tr class="dept even"><td class="label">Department</td><td data-type="dept">'+dept+'</td></tr>';
			}	
			
			/*
			try{
				type = json.result.items[i].type[1].label[0];
			}catch(e){}
			if(typeof type != 'undefined'){
			} else {
				html += '<tr class="type odd"><td class="label">Type</td><td>?</td></tr>';
			}	
			*/
			
			/*
			try{
				type = json.result.items[i].type[0].label[0];
			}catch(e){}
			if(typeof type != 'undefined'){
				html += '<tr class="type even"><td class="label">Type</td><td data-type="type">'+type+'</td></tr>';
			}else {
				html += '<tr class="type even"><td class="label">Type</td><td data-type="type">?</td></tr>';			
			}
			*/
			
			try{
				grade = json.result.items[i].grade.label[0];
			}catch(e){}			
			if(typeof grade != 'undefined'){
				html += '<tr class="grade even"><td class="label">Grade</td><td data-type="grade">'+grade+'</td></tr>';
			}else {
				html += '<tr class="grade even"><td class="label">Grade</td><td data-type="grade">?</td></tr>';		
			}			
			
			try{
				salaryRange = json.result.items[i].salaryRange.label[0];
			}catch(e){}
			if(typeof salaryRange != 'undefined'){
				html += '<tr class="salaryRange odd"><td class="label">Salary</td><td data-type="type">'+salaryRange+'</td></tr>';
			}else {
				html += '<tr class="salaryRange odd"><td class="label">Salary</td><td data-type="type">?</td></tr>';			
			}
		
			try{
				reportsTo = json.result.items[i].reportsTo[0].heldBy[0].name;
			}catch(e){}
			if(typeof reportsTo != 'undefined'){
				html += '<tr class="reportsTo even end"><td class="label">Reports to</td><td>'+reportsTo+'</td></tr>';
			} else {
			}	
			
			html += '</table>';
			
			html += '</div>';
		}
		
		// List of div's generated
		// Call QuickSand to swap with original divs.
		
		//$('#infovis').quicksand( html, { adjustHeight: 'dynamic' } );
		
		$("div.postHolder").html(html);
		
		$("div.post").click(function(){
			window.location = "../organogram?dept="+PostList.vars.dept+"&post="+$(this).attr("rel")+(PostList.vars.previewMode?'&preview=true':'');
		});
		
		//$("div.post").dropShadow();
		
		$("#infovis").css("visibility","visible");
		
		PostList.setQuickSand();
								
		PostList.displayDataSources();
		
		PostList.hideLog();

	},
	setQuickSand:function(){
	
	  // bind radiobuttons in the form
	  var $sortInput = $('select#sortBy');
	
	  // get the first collection
	  var $posts = $('div.postHolder');
	  
	  // clone applications to get a second collection
	  var $data = $posts.clone();
	
	  // attempt to call Quicksand on every form change
	  $sortInput.change(function(e) {
			
	    // if sorted by size
	    if ($(this).val() == "name") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		  		return $(a).find('p[data-type=name]').text().toLowerCase() > $(b).find('p[data-type=name]').text().toLowerCase() ? 1 : -1;
	  		});
	    } else if ($(this).val() == "title") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		  		return $(a).find('h3[data-type=title]').text().toLowerCase() > $(b).find('h3[data-type=title]').text().toLowerCase() ? 1 : -1;
	  		});
	    } else if ($(this).val() == "unit") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		  		return $(a).find('td[data-type=unit]').text().toLowerCase() > $(b).find('td[data-type=unit]').text().toLowerCase() ? 1 : -1;
	  		});
	    }  else if ($(this).val() == "type") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		  		return $(a).find('td[data-type=type]').text().toLowerCase() > $(b).find('td[data-type=type]').text().toLowerCase() ? 1 : -1;
	  		});
	    }  else if ($(this).val() == "grade") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		  		return $(a).find('td[data-type=grade]').text().toLowerCase() > $(b).find('td[data-type=grade]').text().toLowerCase() ? 1 : -1;
	  		});
	    }     
		
	    // finally, call quicksand
	    $posts.quicksand($sortedData,{
	    	adjustHeight: 'dynamic'
	    },function(){
			$("div.post").click(function(){
					window.location = "../organogram?dept="+PostList.vars.dept+"&post="+$(this).attr("rel");
				});
	    });
	
	  });
	
	},	
	displayDataSources:function() {
		/*
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
		*/
	},
	resetSourceLinks:function() {
		
		$("div#apiCalls a.source").click(function(){
			$("div#apiCalls div.apiCall").hide();
			$(this).next().fadeIn();
		});
		
		$("a.close").click(function(){
			$(this).parent().fadeOut();
		});
			
		return false;
	},	
 	showLog:function(string){
		$("#log img").show();
		$("#log span").html(string);
		$("#log").fadeIn();
		return false;
	},
	changeLog:function(string, showImg){
		$("#log span").html(string);
		if(showImg){
	
		}else {
			$("#log img").hide();
		}
		return false;
	},
	hideLog:function() {
		setTimeout(function() {
			$("#log").fadeOut();
		},1000);
		return false;	
	}		
}; // end PostList

function log(info){
	PostList.vars.debug && window.console && console.log && console.log(info);
}

$(document).ready(function() {

	//$("#infovis").width($(window).width()-140);
	//$("#infovis").height($(window).height()-71);
	
	$('div.about-tip').dialog({autoOpen:false, buttons: [
  		{
        	text: "Ok",
        	click: function() { $(this).dialog("close"); }
    	}
	], modal: true, position: 'center', title: 'About', resizable: false, width: 500, zIndex: 9999});
	
	
	$( "a.aboutToggle").button().click(function() { $('div.about-tip').dialog('open'); return false;});
	

	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	$('div#right').children().css('visibility','visible');
	
	$("select#loadBy").val("Permanent Secretary");
	
	$("select#loadBy").change(function(e){
	
	var loadType = e.originalEvent.explicitOriginalTarget.parentNode.label;
	
		$("div.postHolder").html("");
		//$("div.postHolder").css("height","auto");
		if(loadType == "Post type"){
			PostList.init(PostList.vars.dept,PostList.vars.unit,$(this).val(),'');		
		} else if(loadType == "Grade"){
			PostList.init(PostList.vars.dept,PostList.vars.unit,'',$(this).val());
		}
		//$('#infovis').quicksand( $('#infovis').find("div."+postType), { adjustHeight: 'dynamic' } );
	});
	
	$("select#sortBy").val("--");
		
	$("div#right").show();
	
	if($.browser.msie) {
		$("div#log").corner();
		$("div#right").corner("tl bl 10px");
	}	
});