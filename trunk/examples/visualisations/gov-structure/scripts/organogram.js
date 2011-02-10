/*

organogram.js

Spacetree visualisation from the JIT.
http://thejit.org/

Modified by Dan Paul Smith
@danpaulsmith.

2011

*/

/*** Customisation variables ***/

/*** Globals ***/

var global_department="", global_postJSON="", global_post="", global_ST="", labelType="", useGradients="", nativeTextSupport="", animate="";
var debug = true;
var api_call_info = [];
var firstLoad = true;
var autoalign = true;
var reOpen = false;
var cacheObj;

var visOffsetX=100;
var visOffsetY=0;

/*cacheObj = {
	req:[{
		id:0,
		url:"http://example.com",
		json:
	}],
}*/

$(document).ready(function() {

	$("#infobox").hide();
	$("#infovis").width($(window).width()-0);
	$("#infovis").height($(window).height()-30);	

	// Breadcrumbs
	$(function() {
	    $( "button#post" ).button({
	        text: true,
	        disabled: true
	    }).click(function() {
	        // nothing
	    });    
	    $( "button#unit" ).button({
	        text: true,
	    }).click(function() {
	        window.location = $(this).attr("rel");
	    });
	    $( "button#dept" ).button({
	        text: true
	    }).click(function() {
	        window.location = $(this).attr("rel");
	    });       
	});
		
	$('div.about-tip').dialog({
		autoOpen:false, 
		buttons: [{
        	text: "Ok",
        	click: function() { $(this).dialog("close"); }
    	}], 
    	modal: true, 
    	position: 'center', 
    	title: 'About', 
    	resizable: false, 
    	width: 500, 
    	zIndex: 9999
    });
	
	$( "a.aboutToggle").button();
	$( "a.aboutToggle" ).click(function() { $('div.about-tip').dialog('open')});
	$( "div#navigate button#up" ).button().click(function(){});
	$( "div#navigate button#down" ).button();
	$( "div#navigate button#left" ).button();
	$( "div#navigate button#right" ).button();
	$( "div#orientation" ).buttonset().click(function(value){
		if(value.target.id == "top"){
			global_ST.canvas.opt.orientation = "top";
			global_ST.refresh();
		}else if(value.target.id == "left"){
			global_ST.canvas.opt.orientation = "left";
			global_ST.refresh();
		}
	});
	
	$('label[for=top]').click();
	
	$( "div#autoalign" ).buttonset().click(function(value){
		if(value.target.id == "on"){
			autoalign = true;
		}else if(value.target.id == "off"){
			autoalign = false;
			$('div#'+global_ST.clickedNode.id);
		}
	});
	
	$('label[for=on]').click();
	
	// Navigation controls
	$(function() {
	    $( "#navigate #up" ).button({
	        icons: { primary: "ui-icon-circle-arrow-n" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetY = global_ST.canvas.translateOffsetY + 10;
			global_ST.canvas.canvases[0].translate(0,10,false);
	    });    
	     $( "#navigate #down" ).button({
	        icons: { primary: "ui-icon-circle-arrow-s" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetY = global_ST.canvas.translateOffsetY - 10;
			global_ST.canvas.canvases[0].translate(0,-10,false);
	    });  
	     $( "#navigate #left" ).button({
	        icons: { primary: "ui-icon-circle-arrow-w" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetX = global_ST.canvas.translateOffsetX + 10;
			global_ST.canvas.canvases[0].translate(10,0,false);		
	    });  
	     $( "#navigate #right" ).button({
	        icons: { primary: "ui-icon-circle-arrow-e" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetX = global_ST.canvas.translateOffsetX - 10;
			global_ST.canvas.canvases[0].translate(-10,0,false);	
	    });    
	});
	
	$( "#reload button#reset" ).button({
		icons: { primary: "ui-icon-refresh" },
	    text: false
	}).click(function(){
		global_ST.canvas.clear();
		global_ST.graph.clean();
		$('#infovis').html("");
		$('#infobox').html("").hide();	
		init(global_department, global_post,true);
	});

	$('div#right').children().css('visibility','visible');
	
		
}); // end docready

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

function setInfoBoxLinks() {

	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});		
	
	$('div.heldBy').accordion({clearStyle:true, navigation:true, autoHeight:false, collapsible:true, active:true});
	
	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	$('div.panel h3').eq(0).click();

	return false;
}

jQuery.fn.mousehold = function(timeout, f) {
	if (timeout && typeof timeout == 'function') {
		f = timeout;
		timeout = 100;
	}
	if (f && typeof f == 'function') {
		var timer = 0;
		var fireStep = 0;
		return this.each(function() {
			jQuery(this).mousedown(function() {
				fireStep = 1;
				var ctr = 0;
				var t = this;
				timer = setInterval(function() {
					ctr++;
					f.call(t, ctr);
					fireStep = 2;
				}, timeout);
			})

			clearMousehold = function() {
				clearInterval(timer);
				if (fireStep == 1) f.call(this, 1);
				fireStep = 0;
			}
			
			jQuery(this).mouseout(clearMousehold);
			jQuery(this).mouseup(clearMousehold);
		})
	}
}


function a(string) {
	if(debug){
		alert(string);
	}
	return false;
}
function p(string) {
	if(debug){
		console.log(string+"\n");
	}
	return false;
}
function cl(obj) {
	if(debug){
		console.log(obj);
	}
	return false;
}

(function() {
	var ua = navigator.userAgent,
	iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
	typeOfCanvas = typeof HTMLCanvasElement,
	nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
	textSupport = nativeCanvasSupport 
	&& (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
	// I'm setting this based on the fact that ExCanvas provides text support
	// for IE
	// and that as of today iPhone/iPad current text support is lame
	labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
	nativeTextSupport = labelType == 'Native';
	useGradients = nativeCanvasSupport;
	animate = !(iStuff || !nativeCanvasSupport);
})();


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


/* Unique ID generator */
$.generateId = function() {
	return arguments.callee.prefix + arguments.callee.count++;
};
$.generateId.prefix = 'orgvis_ID_';
$.generateId.count = 0;

$.fn.generateId = function() {
	return this.each(function() {
		this.id = $.generateId();
	});
};


function init(deptSlug,postSlug,reload){
	
	global_department = deptSlug;
	
	var getTree = (function() {
		var global_postJSON_string = JSON.stringify(global_postJSON);
		var i = 0;
		return function(nodeId, level) {
			var subtree = eval('(' + global_postJSON_string.replace(/id:\"([a-zA-Z0-9]+)\"/g, 
					function(all, match) {
				return "id:\"" + match + "_" + i + "\""  
			}) + ')');
			$jit.json.prune(subtree, level); i++;
			return {
				'id': nodeId,
				'children': subtree.children
			};
		};
	})();
	
	// Implement a node rendering function called 'nodeline' that plots a
	// straight line
	// when contracting or expanding a subtree.
	$jit.ST.Plot.NodeTypes.implement({
		'nodeline': {
			'render': function(node, canvas, animating) {
				if(animating === 'expand' || animating === 'contract') {
					var pos = node.pos.getc(true), nconfig = this.node, data = node.data;
					var width  = nconfig.width, height = nconfig.height;
					var algnPos = this.getAlignedPos(pos, width, height);
					var ctx = canvas.getCtx(), ort = this.config.orientation;
					ctx.beginPath();
					if(ort == 'left' || ort == 'right') {
						ctx.moveTo(algnPos.x, algnPos.y + height / 2);
						ctx.lineTo(algnPos.x + width, algnPos.y + height / 2);
					} else {
						ctx.moveTo(algnPos.x + width / 2, algnPos.y);
						ctx.lineTo(algnPos.x + width / 2, algnPos.y + height);
					}
					ctx.stroke();
				} 
			}
		}

	});

	// Create a new ST instance
	var st = new $jit.ST({  
		'injectInto': 'infovis', 
		Navigation: {  
			enable: true,  
			panning: 'avoid nodes',  
			zooming: 40
		}, 
		duration: 300,
		orientation: 'top',
		offsetX: visOffsetX,  
		offsetY: visOffsetY, 
		transition: $jit.Trans.Quad.easeIn, 
		levelDistance: 60,  
		levelsToShow: 5, 
		Node: {
			height: 70,
			width: 190,
			type: 'nodeline',
			color:'#333333',
			lineWidth: 2,
			align:"center",
			overridable: true
		}, 
		Edge: {
			type: 'bezier',
			lineWidth: 2,
			color:'#DDDDDD',
			overridable: true
		},  
		request: function(nodeId, level, onComplete) {  
			var ans = getTree(nodeId, level);  
			onComplete.onComplete(nodeId, ans);    
		},  
		onBeforeCompute: function(node){  
		},  
		onAfterCompute: function(){  
			//changeLog("Done",false);
		},  
		onCreateLabel: function(label, node){
		
			if(typeof node.data != 'undefined') {
				for(var i=0;i<node.data.grade.length;i++){
					$(label).addClass(node.data.grade[0]);
				}
				
				if(node.data.heldBy.length > 1){
					for(var i=0;i<node.data.heldBy.length;i++){
						var heldBySlug = node.data.heldBy[i].holdsPostURI.split("/");
						heldBySlug = heldBySlug[heldBySlug.length-1];
						$(label).addClass("post_"+heldBySlug);
					}
				} else {
					var postSlug = node.data.uri.split("/");
					postSlug = postSlug[postSlug.length-1];
					$(label).addClass("post_"+postSlug);
				}
				
				label.id = node.id;        
				
				if(typeof node.name != 'undefined'){
					for(var i=0;i<node.name.length;i++){
						label.innerHTML += node.name[i]+", ";
					}
					label.innerHTML = label.innerHTML.substring(0,label.innerHTML.length-2);			
				} else {
					label.innerHTML = "?";
				}
				
				//log(node);

				if(typeof node.data.postIn != 'undefined' && node.data.postIn.length > 0){					
					for(var a in node.data.postIn){
							if(node.data.postIn[a]._about.indexOf("/unit/") > 0){
								label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">'+node.data.postIn[a].label[0]+'</span>';
							} else {}
					}
				} else {
					label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">?</span>';
				}
				
				if(node.data.heldBy.length>1){
					label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.heldBy.length+'</span>';
				}
			}
			

			label.onclick = function(){ 
			
				var m = {
				    offsetX: st.canvas.translateOffsetX,
				    offsetY: st.canvas.translateOffsetY,
				    enable: autoalign
				};
								
				st.onClick(node.id, { 
					Move: m
				});												
								
				$("div.node").css("border","1px solid #AAAAAA");
				$("div#"+node.id).css("border","3px solid #333333");		

				$("#infobox").fadeOut('fast', function() {
					loadPersonInfo(node);
				});
				
			};  
			
			var style = label.style;
			style.width = 180 + 'px';
			style.height = 'auto';            
			style.cursor = 'pointer';
			style.color = '#000000';
			style.fontSize = '0.8em';
			style.textAlign= 'center';
			style.textDecoration = 'none';
			style.paddingTop = '3px'; 
		},  
		onBeforePlotNode: function(node){  
			if (node.selected) {  
				node.data.$color = "ff7";  
			}  
			else {  
				delete node.data.$color;  
			}  
		}, 
		onBeforePlotLine: function(adj){
			if (adj.nodeFrom.selected && adj.nodeTo.selected) {
				adj.data.$color = "#333333";
				adj.data.$lineWidth = 4;
			}
			else {
				delete adj.data.$color;
				delete adj.data.$lineWidth;
			}
		}
	});  
	
	global_ST = st;

	if(!reload){
		loadPost(deptSlug,postSlug);
	}else{
		reloadPost();
	}	

} // end init

function reloadPost() {

	global_ST.loadJSON(global_postJSON);
	// compute node positions and layout
	global_ST.compute();
	
	// cl(global_ST.canvas.getPos(true));
	
	// global_ST.canvas.scale(1,1,false);
	//global_ST.canvas.translate(-150-(global_ST.canvas.translateOffsetX),-200-(global_ST.canvas.translateOffsetY),false)
	
	//var slug = firstNode.id.split("/");
	//slug = slug[slug.length-1];
	//var node = global_ST.graph.getNode("post_"+global_post);
	
	//$("div#"+global_ST.root).click();
	//global_ST.setRoot("post_"+global_post);
	global_ST.onClick(global_ST.root);
	
	setTimeout(function(){
		if(!global_ST.busy){
			$("div.post_"+global_post).click();
		} else {
			setTimeout(function(){
				$("div.post_"+global_post).click();
			},1000);							
		}
	},1000);
						
	// end
	
	displayDataSources();
}

function loadPost(deptSlug,postSlug) {

	var postTree;	
	global_post = postSlug;
		
	showLog("Loading post ...");

	$("#infovis-label").html("");
	$("#infobox").fadeOut();
	
	var postInQuestion, postInQuestionReportsTo = [], firstNode;	

	// Make an API call to retrieve information about the root post
	var api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug;
	//var api_url = "http://danpaulsmith.com/puelia3/doc/department/"+deptSlug+"/post/"+postSlug;alert("using danpaulsmith.com API & google CDN for jqueryUI");
	
	// Description of API call
	api_call_info.push({
		title:"Retrieval of root post information",
		description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
		url:api_url,
		parameters:""
	});
	
	$.ajax({	
		url: api_call_info[api_call_info.length-1].url+".json"+"?callback=?",
		type: "GET",
		dataType: "jsonp",
		async:true,
		cache:true,
		success: function(json){
				
				try{
				
				postInQuestion = json.result.primaryTopic;
				//console.log("Post In Question:");
				//console.log(postInQuestion);
				//firstNode = makeNode(json.result.primaryTopic);
	
				// Extract information for visualisation breadcrumbs
				$("h1.title button#post").html(json.result.primaryTopic.label[0]);
				
				var uSlug,dSlug;	
					
				for(var a in json.result.primaryTopic.postIn){
					if(json.result.primaryTopic.postIn[a]._about.indexOf("/unit/") > 0){
						$("h1.title button#unit").html(json.result.primaryTopic.postIn[a].label[0]);
						uSlug = json.result.primaryTopic.postIn[a]._about.toString().split("/");
						uSlug = uSlug[uSlug.length-1];				
					} else {
						$("h1.title button#dept").html(json.result.primaryTopic.postIn[a].label[0]);
						dSlug = json.result.primaryTopic.postIn[a]._about.toString().split("/");
						dSlug = dSlug[dSlug.length-1];		
					}
				}
				
				$("h1.title button#unit").attr("rel","../departments?dept="+dSlug+"&unit="+uSlug);
				$("h1.title button#dept").attr("rel","../departments?dept="+dSlug);
			
				$("h1.title button").css("visibility","visible");
				$("h1.title button#dept").animate({opacity:'1'},1000,function(){
					$("h1.title button#unit").animate({opacity:'1'},1000,function(){
						$("h1.title button#post").animate({opacity:'1'},1000);
					})
				});			
				//cl(firstNode);
				
				var tempPostEl = json.result.primaryTopic;
				
				// Store the post ID's that the postInQuestion reports to
				var piqrtSlug = tempPostEl._about.toString().split("/");
				piqrtSlug = piqrtSlug[piqrtSlug.length-1];
				postInQuestionReportsTo.push(piqrtSlug);
				
				if(typeof tempPostEl.reportsTo != 'undefined') {
					for(var a=0;a<tempPostEl.reportsTo.length;a++){
							
						piqrtSlug = tempPostEl.reportsTo[a]._about.toString().split("/");
						piqrtSlug = piqrtSlug[piqrtSlug.length-1];
						postInQuestionReportsTo.push(piqrtSlug);
												
						if(typeof tempPostEl.reportsTo[a].reportsTo != 'undefined'){
							tempPostEl = tempPostEl.reportsTo[a];						
							a=a-1;
						} else {
						
						}
					}
				} else {}

				log("postInQuestionReportsTo: ");
				log(postInQuestionReportsTo);
								
				// Make a second API call to retrieve information about the posts that report to the root post
				api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug+"/reportsFull";
				//api_url = "http://danpaulsmith.com/puelia3/doc/department/"+deptSlug+"/post/"+postSlug+"/reportsFull";alert("Using danpaulsmith.com API");
	
				api_call_info.push({
					title:"Retrieval of posts that report to the root post",
					description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
					url:api_url,
					parameters:"?_pageSize=300"
				});				
				
				
				$.ajax({
					url: api_call_info[api_call_info.length-1].url+".json"+api_call_info[api_call_info.length-1].parameters+"&callback=?",
					type: "GET",
					dataType: "jsonp",
					async:true,
					cache:true,
					success: function(json2){
															
						// Search for the post in question
						for(var i=0;i<json2.result.items.length;i++){
							if(postInQuestion._about == json2.result.items[i]._about){
								postInQuestion = json2.result.items[i];
							}
						}

						/*
						 * Establish the first node of the organogram 
						 * (the post that doesn't report to any other posts)
						 */
						if(typeof postInQuestion.reportsTo != 'undefined') {
							for(var j=0;j<postInQuestion.reportsTo.length;j++){
								if(typeof postInQuestion.reportsTo[j].reportsTo != 'undefined' && postInQuestion.reportsTo[j].label != 'undefined' && typeof postInQuestion.reportsTo[j]._about != 'undefined'){
									postInQuestion = postInQuestion.reportsTo[j];
									j=j-1;
								} else if(typeof postInQuestion.reportsTo[j]._about != 'undefined') {
									firstNode = makeNode(postInQuestion.reportsTo[j]);
								} else {
									firstNode = makeNode(postInQuestion);								
								}
							}
						} else {
							firstNode = makeNode(postInQuestion);						
						}
						
						global_postJSON = connectPosts(json2.result.items,firstNode);
						
						groupSamePosts(global_postJSON,false);
						
						// load json data
						global_ST.loadJSON(global_postJSON);
						// compute node positions and layout
						global_ST.compute();
			
						global_ST.onClick(global_ST.root);

						changeLog("Aligning node ...",true);
						var t = 0;
						var c = postInQuestionReportsTo.length;
						log("start c="+c);
						setTimeout(function(){	
							t = setInterval(function(){
								if(c == 1){
									if(!global_ST.busy){
										clearInterval(t);
										global_ST.onClick($("div.post_"+postInQuestionReportsTo[c-1].toString()).attr("id"));
										$("div.post_"+postInQuestionReportsTo[c-1].toString()).click();
										hideLog(); 
										return false;
									}
								} else {
									if(!global_ST.busy){
										global_ST.onClick($("div.post_"+postInQuestionReportsTo[c-1].toString()).attr("id"));
										c--;
									}
								}				
							},250);
						},500);	
						//end
						
						displayDataSources();
						
					}
				}); // end ajax
				
			}catch(e){
				// No success when retrieving information about the root post
				cl(e);
			}
		}
	}); // end ajax;

	return false;
}

function connectPosts(api_items,firstNode){

	var postList = {};
	var visJSON;
	
	var fNodeID = firstNode.data.uri.split("/");
	fNodeID = fNodeID[fNodeID.length-1];
	postList[fNodeID] = firstNode;
	
	// Build an associative array of posts using their post ID
	$.each(api_items, function (index, el) {
			try{
				var postID = el._about.split("/");
				postID = postID[postID.length-1];
				// If the key doesn't exist already
				if (!postList[postID]) {
					// Create the key and give it a value
					postList[postID] = makeNode(el);
					
				} else {}
			}catch(e){
				log(e);
			}
	});	
	
	log("postList:");
	log(postList);
	
	$.each(postList, function (index, el) {
		
		if(typeof el.data.reportsTo != 'undefined' && el.data.reportsTo.length > 0) {
			var postID = el.data.reportsTo[0].split("/");
			postID = postID[postID.length-1];
			postList[postID].children.push(el);
		} else {
			visJSON = el;
		}
		
	});
		
	log("visJSON:")
	log(visJSON);

	return visJSON;
	
}


function groupSamePosts(jsonObj,firstNodeFound) {
		
	if( typeof jsonObj == "object" ) {
	
		$.each(jsonObj, function(k,v) {
		
			if(k == "children" && !firstNodeFound) {
					if(v.length > 1) {	
						for(var i=0;i<v.length-1;i++) {
							for(var j=i+1;j<v.length;j++) {
								for(var a=0;a<v[i].name.length;a++){
									for(var b=0;b<v[j].name.length;b++){
										if(v[i].name[a] == v[j].name[b] && v[i].children.length < 1 && v[j].children.length < 1) {
											for(var c=0;c<v[j].data.heldBy.length;c++){
												v[i].data.heldBy.push(v[j].data.heldBy[c]);
											}
											v.splice(j,1);
											j=j-1;
										}	
									}
								}
							}
						}
					}
				firstNodeFound = true;
			}
			
			if(v != undefined && typeof v == "object") {
			
				if(v.data != undefined) {
			
					if(v.children.length > 1) {	
						for(var i=0;i<v.children.length-1;i++) {
							for(var j=i+1;j<v.children.length;j++) {
								if(v.children[i].name[0] == v.children[j].name[0] && v.children[i].children.length < 1 && v.children[j].children.length < 1) {
									for(var c=0;c<v.children[j].data.heldBy.length;c++){
										v.children[i].data.heldBy.push(v.children[j].data.heldBy[c]);
									}
									v.children.splice(j,1);
									j=j-1;
								}	
							}
						}
					}
				}
			}
			
			return groupSamePosts(v,firstNodeFound); 
		});
	}		
} // end groupSamePosts


function makeNode(item) {

		var node = {
				id:$.generateId(),
				name:[],
				data:{
					uri:"",
					comment:item.comment,
					grade:[],
					type:[],
					postIn:[],
					reportsTo:[],
					heldBy:[],
					processed:false
				},
				children:[]
		};
		
		if(typeof item._about != 'undefined') {
			node.data.uri = item._about;
		} else {
			node.data.uri = "/No URI";
		}
		
		// Handle posts with more than one label
		if(typeof item.label != 'undefined'){
			for(var a=0;a<item.label.length;a++){
				node.name.push(item.label[a]);
			}
		}
				
		// Handle posts with more than one type
		if(typeof item.type != 'undefined'){
			for(a=0;a<item.type.length;a++){
				if(typeof item.type[a] == "object") {
					for(var b=0;b<item.type[a].label.length;b++){			
							node.data.type.push(item.type[a].label[b].toString());
					}
				}
			}
		}
		
		// Handle posts that are in more than one unit
		if(typeof item.postIn != 'undefined'){
			for(a=0;a<item.postIn.length;a++){
				node.data.postIn.push(item.postIn[a]);
			}
		}
		
		// Handle posts that report to more than one post
		if(typeof item.reportsTo != 'undefined'){
			for(a=0;a<item.reportsTo.length;a++){
				node.data.reportsTo.push(item.reportsTo[a]._about);
			}	
		}
		
		// Handle posts that are held by more than one person (before grouping)
		if(typeof item.heldBy != 'undefined'){	
			for(a=0;a<item.heldBy.length;a++){
			
				var person = {
						foafName:"",
						foafPhone:"",
						foafMbox:"",
						holdsPostURI:"",
						reportsToPostURI:[],
						comment:"",
						salaryCostOfReports:-1,
						salaryCostOfReportsDate:""
				};
				
				if(typeof item.heldBy[a].name != 'undefined'){person.foafName = item.heldBy[a].name;}
				if(typeof item.heldBy[a].phone != 'undefined'){person.foafPhone = item.heldBy[a].phone.label[0];}
				if(typeof item.heldBy[a].email != 'undefined'){person.foafMbox = item.heldBy[a].email.label[0];}
				if(typeof item._about != 'undefined'){person.holdsPostURI = item._about;}
				if(typeof item.comment != 'undefined'){person.comment = item.comment;}
				
				if(typeof item.reportsTo != 'undefined'){
					for(var b=0;b<item.reportsTo.length;b++){
						person.reportsToPostURI.push(item.reportsTo[b]._about);
					}
				}
				node.data.heldBy.push(person);
			}
		}
		
		//log("made node:");
		//log(node);

	return node;
}

function copyNode(node) {

	var newNode = {
			id:''+$.generateId(),
			name:node.name,
			data:{
				uri:node.data.uri,
				comment:node.data.comment,
				grade:node.data.grade,
				type:node.data.type,
				postIn:node.data.postIn,
				reportsTo:node.data.reportsTo,
				heldBy:[],
				processed:true
			},
			children:[]
	}

	return newNode;

}

function loadPersonInfo(node){
			
	var postID = node.data.uri.split("/");
	postID=postID[postID.length-1];
	var postUnit;
	var tempUnitID;
	var tempUnitLabel;

	//log(node);
	
	for(var j=0;j<node.data.postIn.length;j++){
		if(node.data.postIn[j]._about.indexOf("/unit/") >= 0){
			tempUnitID = node.data.postIn[j]._about.split("/");
			tempUnitID = tempUnitID[tempUnitID.length-1];
			tempUnitLabel = node.data.postIn[j].label[0];
			postUnit = node.data.postIn[j]._about;
		}
	}
	
	//log("postUnit = "+postUnit);

	// Construct the HTML for the infobox
	var html = '<h1>'+node.name+'</h1>';			
	html += '<div class="panel heldBy ui-accordion ui-widget ui-helper-reset ui-accordion-icons">';

	for(var i=0; i<node.data.heldBy.length; i++) {

		var tempID = node.data.heldBy[i].holdsPostURI.split("/");
		tempID = tempID[tempID.length-1];
				
		if(typeof node.data.heldBy[i].foafName != 'undefined' && node.data.heldBy[i].foafName != ''){
			html += '<h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-e"></span><a class="name infobox_'+tempID+'">'+node.data.heldBy[i].foafName+'</a></h3>';
		}else {
			html += '<h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-e"></span><a class="name infobox_'+tempID+'">?</a></h3>';		
		}

		html += '<div class="content ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">';
		
		html+= '<p class="id"><span>Post ID</span><a target="_blank" href="http://reference.data.gov.uk/id/department/'+global_department+'/post/'+tempID+'">'+tempID+'</a> <a class="view_org" href="?dept='+global_department+'&post='+tempID+'">[View organogram]</a></p>';
				
		if(typeof node.data.heldBy[i].comment != 'undefined' && node.data.heldBy[i].comment.toString().length > 1){
			html+='<p class="comment"><span>Comment</span><span class="text">'+node.data.heldBy[i].comment+'</span></p>';
		}


		if(typeof node.data.heldBy[i].foafPhone != 'undefined' && node.data.heldBy[i].foafPhone != ''){
			html += '<p class="tel"><span>Phone</span>'+node.data.heldBy[i].foafPhone+'</p>';
		}

		if(typeof node.data.heldBy[i].foafMbox != 'undefined' && node.data.heldBy[i].foafMbox != ''){
			html += '<p class="email"><span>Email</span> '+node.data.heldBy[i].foafMbox+'</p>';
		}
			
		if(typeof node.data.grade != 'undefined'){
			for(var a=0;a<node.data.grade.length;a++){
				html += '<p class="grade"><span>Grade</span> <span class="g '+node.data.grade[a]+'">'+node.data.grade[a]+'</span></p>';
			}
		}	
						
		html += '<p class="salaryReports"><span>Combined salary of reporting posts </span>Checking...<img class="salaryReports" width="14" height="14" src="../images/loading.gif"></p>';
			
		if(typeof node.data.type != 'undefined'){
			for(var a=0;a<node.data.type.length;a++){
				html += '<p class="type"><span>Type</span>'+node.data.type[a]+'</p>';
			}
		}
		
		html+= '<p class="unit"><span>Unit(s)</span>';
		
		html+= '<a target="_blank" href="http://reference.data.gov.uk/id/department/'+global_department+'/unit/'+tempUnitID+'">'+tempUnitLabel+'</a>';
		
		html+= '</p>';
		
		html += '</div><!-- end content -->';
		
	} // end for loop
		
	if(node.data.heldBy.length < 1){
		html = '<h1>'+node.name+'</h1>';			
		html += '<div class="panel heldBy">';
		html += '<p>This post is either currently not held or there is no data present for the person who holds this post.</p>';
	}
			
	html+= '</div><!-- end panel -->';
	html+= '<a class="close">x</a>';
	
	$("#infobox").html(html);
	setInfoBoxLinks();
	$("#infobox").fadeIn();
	$("div.heldBy").show();
	
	if(firstLoad){
		$("div.panel h3 a.infobox_"+global_post).click(); 
		firstLoad=false;
		reOpen=false;
	} else {
		$("div.panel h3 a").eq(0).click();
		reOpen=true;
	}
	
	displaySalaryReports(node,postUnit);
	
} // end loadPersonInfo

function displaySalaryReports(node,postUnit) {

	postUnit = postUnit.split("/");
	postUnit = postUnit[postUnit.length-1];
	var postLabel = node.name.toString().replace(/ /g,"+");

	// Make an API call to retrieve information about the root post
	var api_url = "http://reference.data.gov.uk/doc/department/"+global_department+"/unit/"+postUnit+"/statistics";
	//var api_url = "http://danpaulsmith.com/puelia3/doc/department/"+global_department+"/unit/"+postUnit+"/statistics";alert("Using danpaulsmith.com API");

	// Call API for post statistics	
	postLabel = postLabel.replace("&","%26");
	
	$.ajax({
		url:api_url+".json?_pageSize=300&aboutPost.label="+postLabel+"&callback=?",
		type: "GET",
		dataType: "jsonp",
		async:true,
		cache:true,
		success: function(json){
		
			// Check to see if posts have statistics
			if(json.result.items.length > 0) {
					
					var stats = json.result.items;
					
					for(var w=0;w<stats.length;w++){
						for(var v=0;v<node.data.heldBy.length; v++) {
							if(stats[w].aboutPost._about == node.data.heldBy[v].holdsPostURI){
								node.data.heldBy[v].salaryCostOfReports = stats[w].salaryCostOfReports;
								var date = stats[w].date.split("/");
	                            date = '['+date[date.length-1]+']';
								node.data.heldBy[v].salaryCostOfReportsDate = date;
								if(node.data.heldBy[v].salaryCostOfReports > -1){							
									$("div.panel div.content").each(function(){									
										if($(this).children("p.id").children("a").attr("href") == node.data.heldBy[v].holdsPostURI.toString()) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><a target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics" value="'+node.data.heldBy[v].salaryCostOfReports+'">£'+addCommas(node.data.heldBy[v].salaryCostOfReports)+'</a> <span class="date">'+node.data.heldBy[v].salaryCostOfReportsDate+'</span>');
										}
									});					
								} else {
									$("div.panel div.content").each(function(){
										if($(this).children("p.id").children("a").attr("href") == node.data.heldBy[v].holdsPostURI) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><a target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">N/A</a>');
										}
									});								
								} // end else									
							} // end if
						} // end for
					} // end for

					
					// Description of API call
					for(var x=0;x<api_call_info.length;x++){
						if(api_call_info[x].title == "Retrieval of post's statistics data"){
							api_call_info.splice(x,1);
						}
					}
					
					api_call_info.push({
						title:"Retrieval of post's statistics data",
						description:"Retrieves stasitics such as the total salary figure for posts, specifically reporting to: \""+node.name+"\"",
						url:api_url,
						parameters:'?_pageSize=300&aboutPost.label='+postLabel
					});			
							
					displayDataSources();
							
			} else {
					for(var y=0;y<api_call_info.length;y++){
						if(api_call_info[y].title == "Retrieval of post's statistics data"){
							api_call_info.splice(y,1);
						}
					}			
					for(var v=0;v<node.data.heldBy.length; v++) {					
						$("div.expander div.content").each(function(){
							if($(this).children("p.id").children("a").attr("href") == node.data.heldBy[v].holdsPostURI) {
								$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><a target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">N/A</a>');
							}
						});	
					}
			}
			
			
			
		} // end success
	}); // end ajax call
		
	return false;
}


function displayDataSources() {
	
	$('div#apiCalls').fadeOut();
	
	var html='<p class="label">Data sources</p>';
	
	for(var i=0;i<api_call_info.length;i++){
		
		html += '<a class="source">'+(i+1)+'</a>';
		
		html += '<div class="apiCall shadowBox">';
		
		html += '<p class="title"><span>API call '+(i+1)+':</span>'+api_call_info[i].title+'</p>';
		html += '<p class="description"><span>Description:</span>'+api_call_info[i].description+'</p>';
		html += '<p class="url"><span>URL:</span><a href="'+api_call_info[i].url+'.html" target="_blank">'+api_call_info[i].url+'</a></p>';	

		if(api_call_info[i].parameters != ""){
			html += '<p class="params"><span>Parameters:</span></p>';
			
			var tempParams = api_call_info[i].parameters.replace("?","").split("&");
					
			html += '<ul class="paramlist">';
			for(var j=0;j<tempParams.length;j++){
				html+= '<li>'+tempParams[j]+'</li>';
			}
			html += '</ul>';
		}
		
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
	debug && window.console && console.log && console.log(info);
}