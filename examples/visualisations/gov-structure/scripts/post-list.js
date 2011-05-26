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
		pbod:"",
		org:"",
		orgType:"",
		orgTypeSlug:"",
		postType:"",
		grade:"",
		previewMode:false,		// Used to initialise authentication and to swap API locations
		previewParam:false,
		apiCallInfo:{},
		debug:true,
		apiBase:"http://reference.data.gov.uk"
	},
	init:function(pDept,pBod,pUnit,property,value,pMode){
	
		if(pMode == "clear"){
			$.cookie("organogram-preview-mode", null);
			$.cookie("organogram-username", null);
			$.cookie("organogram-password", null);
		}

		log('$.cookie("organogram-preview-mode"):'+$.cookie("organogram-preview-mode"));
		log("pMode: "+pMode);
			
		if(pDept.length>0){
			log("department");
			PostList.vars.org = pDept;
			PostList.vars.orgType = "department";
			PostList.vars.orgTypeSlug = "dept";
		}else if(pBod.length>0){
			log("public-body");
			PostList.vars.org = pBod;
			PostList.vars.orgType = "public-body";
			PostList.vars.orgTypeSlug = "pubbod";
		} else {
			PostList.notify("Error","Cannot load post list, no organisation selected", true, "error_noOrg");		
		}			
		
		PostList.vars.dept = pDept;
		PostList.vars.pbod = pBod;
		PostList.vars.unit = pUnit;
		PostList.vars.property = property;
		PostList.vars.value = value;
			
		// Check for preview parameter
		if(pMode == "true"){
			log("Param: In preview mode");
			// In preview mode
			
			PostList.vars.apiBase = "organogram.data.gov.uk";			
			//PostList.vars.apiBase = "organogram.data.gov.uk/puelia5";
			//PostList.vars.apiBase = "192.168.2.8/puelia5";
			//PostList.vars.apiBase = "localhost/puelia5"
			PostList.vars.previewParam = true;			

		} else if($.cookie("organogram-preview-mode")) {
			log("Cookie: In preview mode");
			// In preview mode
			PostList.vars.previewMode = true;
			$("span#previewModeSign").show();
			PostList.vars.apiBase = "organogram.data.gov.uk";
			//PostList.vars.apiBase = "organogram.data.gov.uk/puelia5";
			//PostList.vars.apiBase = "192.168.2.8/puelia5";
			//PostList.vars.apiBase = "localhost/puelia5"
		} else {
			log("Not in preview mode");
			// Not in preview mode
			PostList.vars.apiBase = "reference.data.gov.uk";
		}	


		switch(PostList.vars.property){
		
			case 'grade' :
			
				$("select#loadBy").val(PostList.vars.value.replace("+"," "));
				PostList.getPostList(PostList.vars.property,PostList.vars.value);
				break;			
					
			case 'type' :
			
				$("select#loadBy").val(PostList.vars.value.replace("+"," "));
				PostList.getPostList(PostList.vars.property,PostList.vars.value);
				break;
				
			default :
			
				PostList.vars.property = "grade";
				PostList.vars.value = $("select#loadBy").val();
				PostList.getPostList(PostList.vars.property,PostList.vars.value);
				break;			
		}	

		$('div#apiCalls').hide();
		$("a.source").remove();
		$('div.apiCall').remove();
				
	},
	getPostList:function(property,value){
		
		// (grade, Grade, SCS1)
		// (type, Type, Deputy Director)

		$("div.noPosts").hide();
		
		var pageSize = 50;
		var combinedJSON = {};
		var pageNumber = 1;

		PostList.vars.apiCallInfo.postList = {
			title:"Posts by "+property,
			description:"Retrieves posts within department by their "+property,
			url:"http://"+PostList.vars.apiBase+"/doc/"+PostList.vars.orgType+"/"+PostList.vars.org+"/post",
			parameters:"?_pageSize="+pageSize+"&"+property+"="+value.replace(" ","+"),
			complete:false
		};
		
		var s = {
			url: PostList.vars.apiCallInfo.postList.url+".json"+PostList.vars.apiCallInfo.postList.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			cache:true,
			error: function(){
				$("div#loading_postsBy"+property).trigger("jGrowl.close").remove(); 					
				PostList.notify("Error","Could not load posts by "+property, true, "error_postList");
			},
			success: function(json){	

				if(json.result.items.length < 1){
					$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();
					PostList.notify("Success","Loaded posts with "+property+": "+value,false,"success_postsBy"+property);
					PostList.displayNoPosts(PostList.vars.property,PostList.vars.value);
				} else {
					
					// Store results
					if(typeof combinedJSON.result == 'undefined'){
						combinedJSON = json;
					} else {
						combinedJSON.result.items = combinedJSON.result.items.concat(json.result.items);
					}
									
					// Grab more pages	
					if(typeof json.result.next != 'undefined'){
						
						log("Posts with "+property+": "+value+" ("+pageNumber+") - more pages...");
						//log(this);
						pageNumber++;
						s.url = s.url+"&_page="+pageNumber;
						s.url = s.url.replace("&_page="+(pageNumber-1),"");
	
						$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();
						if(pageNumber > 1){
							PostList.notify("Success","Loaded posts with "+property+": "+value,false,"success_postsBy"+property);
						} else {
							PostList.notify("Success","Loaded posts with "+property+": "+value+" ("+(pageNumber-1)+")",false,"success_postsBy"+property);
						}
						PostList.notify("Loading","Posts with "+property+": "+value+" ("+pageNumber+")",true,"loading_postsBy"+property);
						
						$.myJSONP(s,property,value);
				
					} else if(pageNumber > 1) {
						// Pass data to the regData function
						log("no more pages, loading posts");
						log(combinedJSON);
						
						PostList.notify("Success","Loaded posts with "+property+": "+value+" ("+(pageNumber-1)+")",false,"success_postsBy"+property);
						$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();					
						
						PostList.vars.previewMode = "true";
						PostList.loadPosts(combinedJSON);
	
						PostList.vars.apiCallInfo.postList.complete = true;
					} else {
						// Pass data to the regData function
						log("no more pages, loading posts");
						log(combinedJSON);
						
						PostList.notify("Success","Loaded posts with "+property+": "+value,false,"success_postsBy"+property);
						$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();					
						
						PostList.vars.previewMode = "true";
						PostList.loadPosts(combinedJSON);
						PostList.vars.apiCallInfo.postList.complete = true;
					}	
				}
			}		
		}
		
		if(PostList.vars.previewMode || PostList.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			//s.url = s.url.replace("reportsFull","reports-full");
		}
				
		PostList.notify("Loading","Posts with "+property+": "+value, true, "loading_postsBy"+property);
		$.myJSONP(s,property,value);
						
	},
	displayNoPosts:function(filter,value){

		$("div.noPosts").html('<p>No posts found for '+PostList.vars.orgType+' ID "'+PostList.vars.org+'", when filtering by '+filter+': '+value+'</p>');

		PostList.displayDataSources();
				
		$("div.noPosts").show();
		
	},
	loadPosts:function(json){
	
		//var postList = new Array();
			
		var html='';
		var slug = null;
		var postStatus = null;
		var label = null;
		var name = null;
		var comment = null;
		var email = null;
		var phone = null;
		var unit = null;
		var dept = null;
		var type = null;
		var reportsTo = null;
		var grade = null;
		var salaryRange = null;
					
		for(var i=0,itemLength=json.result.items.length;i<itemLength;i++){
		
			slug = json.result.items[i]._about.split("/");
			slug = slug[slug.length-1];
			
			html += '<div class="post" rel="'+slug+'" data-id="id-'+slug+'">';
			
			postStatus = json.result.items[i].postStatus;
			
			try{
				label = json.result.items[i].label[0];
			}catch(e){
			  label = null;
			}
			if (label){
				html += '<h3 class="label" data-type="title">'+label+'</h3>';
			} else {
				html += '<h3 class="label" data-type="title">?</h3>';						
			}			
						
			html += '<div class="image"><img width="130" src="../images/no_profile.jpg" /></div>';
			
			try{
				name = json.result.items[i].heldBy[0].name;
			}catch(e){
			  name = null;
			}
			if(postStatus == 'http://reference.data.gov.uk/def/civil-service-post-status/vacant') {
				html += '<p class="name ui-state-hover" data-type="name">Vacant</p>';
			} else if (name){
				html += '<p class="name ui-state-hover" data-type="name">'+name+'</p>';
			} else {
				html += '<p class="name ui-state-hover" data-type="name">?</p>';
			}

			try{
				comment = json.result.items[i].comment;		
			}catch(e){
			  comment = null;
			}
			if(comment){
				//html += '<p class="comment">'+comment+'</p>';
			} else {
			}

			html += '<table>';
			

			try{
				email = json.result.items[i].heldBy[0].email.label[0];
			}catch(e){
			  email = null;
			}
			if(email){
				//html += '<tr class="email odd"><td class="label">Email</td><td>'+email+'</td></tr>';
			} else {
				//html += '<tr class="email odd"><td class="label">Email</td><td>'+email+'</td></tr>';
			}			

			try{
				phone = json.result.items[i].heldBy[0].phone.label[0];
			}catch(e){
			  phone = null;
			}
			if(phone){
				//html += '<tr class="phone even"><td class="label">Phone</td><td>'+phone+'</td></tr>';
			} else {
				//html += '<tr class="phone even"><td class="label">Phone</td><td>'+phone+'</td></tr>';
			}	
						

			try{
			  postIn = json.result.items[i].postIn;
			  unit = null;
			  for (var j=0; j<postIn.length; j++) {
			    if (postIn[j].type[0] == 'http://www.w3.org/ns/org#OrganizationalUnit') {
			      unit = postIn[j].label[0];
			    }
			  }
			}catch(e){
			  unit = null;
			}
			if(unit){
				html += '<tr class="unit odd"><td class="label">Unit</td><td data-type="unit">'+unit+'</td></tr>';
			} else {
				html += '<tr class="unit odd"><td class="label">Unit</td><td data-type="unit">?</td></tr>';
			}	
			
			try{
				dept = json.result.items[i].postIn[1].label[0];
			}catch(e){
			  dept = null;
			}
			if(dept){
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
			}catch(e){
			  grade = null;
			}			
			if(grade){
				html += '<tr class="grade even"><td class="label">Grade</td><td data-type="grade">'+grade+'</td></tr>';
			}else {
				html += '<tr class="grade even"><td class="label">Grade</td><td data-type="grade">?</td></tr>';		
			}			
			
			try{
				salaryRange = json.result.items[i].salaryRange.label[0];
			}catch(e){
			  salaryRange = null;
			}
			if(salaryRange){
				html += '<tr class="salaryRange odd"><td class="label">Salary</td><td data-type="salaryRange">'+salaryRange+'</td></tr>';
			}else {
				html += '<tr class="salaryRange odd"><td class="label">Salary</td><td data-type="salaryRange">?</td></tr>';			
			}
		
			try{
				reportsTo = json.result.items[i].reportsTo[0].heldBy[0].name;
			}catch(e){
			  reportsTo = null;
			}
			if(reportsTo){
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
			window.location = "../organogram?"+PostList.vars.orgTypeSlug+"="+PostList.vars.org+"&post="+$(this).attr("rel")+(PostList.vars.previewMode?'&preview=true':'');
		});
		
		//$("div.post").dropShadow();
		
		$("#infovis").css("visibility","visible");
		
		PostList.setQuickSand();
								
		PostList.displayDataSources();
		
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
	    }  else if ($(this).val() == "salaryRange") {
	    	$sortedData = $data.find("div.post").sort(function(a, b){
		    	var sal1 = $(a).find('td[data-type=salaryRange]').text().split(" ");
		    	sal1 = sal1[0].match(/\d/g).join("");
		    	var sal2 = $(b).find('td[data-type=salaryRange]').text().split(" ");
		    	sal2 = sal2[0].match(/\d/g).join("");	    	
		  		return parseInt(sal1) > parseInt(sal2) ? 1 : -1;
	  		});
	    }     
		
	    // finally, call quicksand
	    $posts.quicksand($sortedData,{
	    	adjustHeight: 'dynamic'
	    },function(){
			$("div.post").click(function(){
				window.location = "../organogram?"+PostList.vars.orgTypeSlug+"="+PostList.vars.org+"&post="+$(this).attr("rel")+(PostList.vars.previewMode?'&preview=true':'');
			});
	    });
	
	  });
	
	},	
	displayDataSources:function() {
		
		// Need to use a foreach loop to identify the correct key's and values in the
		// new apiCallInfo object.
		
		log("displaying data sources");
		
		//$('div#apiCalls').fadeOut();
		
		var html='<p class="label">Data sources</p>';
		
		var i=0;

		$.each(PostList.vars.apiCallInfo,function(k,v){
			
			log(k);
			log(v);
			
			html += '<a class="source">'+(i+1)+'</a>';
			
			html += '<div class="apiCall shadowBox">';
			
			html += '<p class="title"><span>API call '+(i+1)+':</span>'+v.title+'</p>';
			html += '<p class="description"><span>Description:</span>'+v.description+'</p>';
			html += '<p class="url"><span>Endpoint URL:</span><a href="'+v.url+'">'+v.url+'</a></p>';	
	
			if(v.parameters != ""){
				html += '<p class="params"><span>Parameters:</span></p>';
				
				var tempParams = v.parameters.replace("?","").split("&");
						
				html += '<ul class="paramlist">';
				for(var j=0;j<tempParams.length;j++){
					html+= '<li>'+tempParams[j]+'</li>';
				}
				html += '</ul>';
			}
			
			html += '<p class="formats"><span>Formats:</span>';
			html += '<a href="'+v.url+'.rdf'+v.parameters+'" target="_blank">RDF</a>';
			html += '<a href="'+v.url+'.ttl'+v.parameters+'" target="_blank">TTL</a>';
			html += '<a href="'+v.url+'.xml'+v.parameters+'" target="_blank">XML</a>';
			html += '<a href="'+v.url+'.json'+v.parameters+'" target="_blank">JSON</a>';
			html += '<a href="'+v.url+'.html'+v.parameters+'" target="_blank">HTML</a>';
			html += '</p>';
			html += '<a class="close">x</a>';
			html += '</div><!-- end apiCall -->';
			
			i++;
			
		});	
		
		$('div#apiCalls').html(html);
		
		$('div#apiCalls a.source').each(function(){
			$(this).button({text:true}).toggle(function() { $(this).next('div.apiCall').show();return false; },function(){$('div.apiCall').hide();return false;});
		});
		
		$('p.formats a').each(function(){
			$(this).button({text:true});
		});
		
		PostList.resetSourceLinks();
		
		$('div#apiCalls').fadeIn();
		
		return false;
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
	notify:function(type,message,stick,id) {
	
		$.jGrowl(message,{
				header:type,
				theme:type,
				sticky:stick,
				life:7000,
				growlID:id
		});
		
		if(type == "Success" || type == "Error"){
			$("div#loading_data").trigger("jGrowl.close").remove();
		}

	},
	getSlug:function(string){
		var temp = string.split("/");
		return temp[temp.length-1];
	}	
}; // end PostList

// fn to handle jsonp with timeouts and errors
// hat tip to Ricardo Tomasi for the timeout logic
$.myJSONP = function(s,property,value) {
	
	log("myJSONP, property:"+property+", value:"+value);
		
    s.dataType = 'jsonp';
    $.ajax(s);

    // figure out what the callback fn is
    var $script = $(document.getElementsByTagName('head')[0].firstChild);
    var url = $script.attr('src') || '';
    var cb = (url.match(/callback=(\w+)/)||[])[1];
    if (!cb)
        return; // bail
    var t = 0, cbFn = window[cb];

    $script[0].onerror = function(e) {
        $script.remove();
        handleError(s, {}, "error", e);
        clearTimeout(t);
    };

    if (!s.timeout)
        return;

    window[cb] = function(json) {
        clearTimeout(t);
        cbFn(json);
        cbFn = null;
    };

    t = setTimeout(function() {
        $script.remove();
        handleError(s, {}, "timeout");
        if (cbFn)
            window[cb] = function(){};
    }, s.timeout);
    
    function handleError(s, o, msg, e) {

    	log("Could not load "+s.url);
    	
    	// Check for initial loading notifications
    	switch(property) {
    	
    		case "type" :
    			log("myJSONP - error - closing type notification");
    			$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();
    			break;
    			
    		case "grade" :
    			log("myJSONP - error - closing grade notification");
    			$("div#loading_postsBy"+property).trigger("jGrowl.close").remove();
    			break;
    			    			
    		default :
    			log("myJSONP - error - closing default notification");
    			//$("div#loading_" + postID).trigger("jGrowl.close").remove();
    			break;
		}
		
		PostList.notify("Error","Could not load posts with "+property+": "+value, true,"error_handler_postsBy"+property);
		
		var json = {
				result:{
					_about:s.url,
					items:[]
				}
    		};

    	//if(s.url.indexOf("reports") > 0){    			
			PostList.vars.apiCallInfo.postList.complete = true;    		
    	//}	    		    	
    	//if(s.url.indexOf("junior-staff") > 0){    			
		//	PostList.vars.apiCallInfo.juniorStaff.complete = true;    		
    	//}


		//PostList.regData(json);					
    	
        // support jquery versions before and after 1.4.3
        //($.ajax.handleError || $.handleError)(s, o, msg, e);
    }
};


/* Currency formatting */
function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

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
	
	$("select#loadBy").val("SCS1");
	
	$("select#loadBy").change(function(e){
	
	var loadType = e.originalEvent.explicitOriginalTarget.parentNode.label;
		
		log(loadType);
		
		$("div.postHolder").html("");
		//$("div.postHolder").css("height","auto");
		if(loadType == "Post type"){
			PostList.init(PostList.vars.dept,PostList.vars.pbod,PostList.vars.unit,$(this).val(),'',PostList.vars.previewMode);		
		} else if(loadType == "Grade"){
			PostList.init(PostList.vars.dept,PostList.vars.pbod,PostList.vars.unit,'',$(this).val(),PostList.vars.previewMode);
		}
		//$('#infovis').quicksand( $('#infovis').find("div."+postType), { adjustHeight: 'dynamic' } );
	});
	
	$("select#sortBy").val("--");
		
	if($.browser.msie && $.browser.version.substr(0,1)<7) {	
		// If less than IE7
		$("h1 > *").hide();
	} else {
		$("div#right").show();
	}
	
	if($.browser.msie) {
		$("div#log").corner();
		$("div#right").corner("tl bl 10px");
	}	
});