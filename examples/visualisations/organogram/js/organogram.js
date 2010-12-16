/*
Spacetree visualisation from the JIT.
http://thejit.org/

Modified by @danpaulsmith for the Organogram 
visualisation.

*/

var debug = false;

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


var labelType, useGradients, nativeTextSupport, animate;

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


/*
 * Grab the department parameter from the URL and use it for an API call to list
 * the posts within that department
 */	
var global_department="";
var global_post="";
var global_ST="";
var global_postJSON="";
var api_call_info = [];
	
function init(deptSlug,postSlug){
	
	global_department = deptSlug;
	
	loadPost(deptSlug,postSlug);
	
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
		offsetX: 0,  
		offsetY: 0, 
		transition: $jit.Trans.Sine.easeOut, 
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
			changeLog("Done",false);
			hideLog(); 
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
				
				//console.log(node);
				
				if(typeof node.data.postIn != 'undefined'){
					label.innerHTML = label.innerHTML + '<span class="postIn">'+node.data.postIn[0].label[0]+'</span>';
				} else {
					label.innerHTML = label.innerHTML + '<span class="postIn">?</span>';
				}
				
				if(node.data.heldBy.length>1){
					label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.heldBy.length+'</span>';
				}
			}
			

			label.onclick = function(){ 

				st.onClick(node.id,{
					Move:{
						enable:false
					}
				}); 

				$("div.node").css("border","1px solid #AAAAAA");
				$("div#"+node.id).css("border","2px solid #333333");		

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

} // end init


function loadPost(deptSlug,postSlug) {

	var postTree;	
	global_post = postSlug;
	
	//global_ST.canvas.clear();
	
	showLog("Loading post ...");

	$("#infovis-label").html("");
	$("#infobox").fadeOut();
	
	var postInQuestion;
	var firstNode;	
	//$("div#formats").fadeOut();
	//$('div#apiCalls').fadeOut();
	
	// Make an API call to retrieve information about the root post
	var api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug;
	
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
		success: function(json){
				
				
				try{
				
				postInQuestion = json.result.primaryTopic;
				//console.log("Post In Question:");
				//console.log(postInQuestion);
				//firstNode = makeNode(json.result.primaryTopic);

				$("h1.title span#post").html(json.result.primaryTopic.label[0]);
				var dSlug = json.result.primaryTopic.postIn[1]._about.toString().split("/");
				dSlug = dSlug[dSlug.length-1];		
				$("h1.title span#dept").html(json.result.primaryTopic.postIn[1].label[0]).attr("rel","../gov-structure?dept="+dSlug);
				
				var uSlug = json.result.primaryTopic.postIn[0]._about.toString().split("/");
				uSlug = uSlug[uSlug.length-1];				
				$("h1.title span#unit").html(json.result.primaryTopic.postIn[0].label[0]).attr("rel","../gov-structure?dept="+dSlug+"&unit="+uSlug);

				$("h1.title span").css("visibility","visible");
				$("h1.title span#post").animate({opacity:'1'},1000,function(){
					$("h1.title span#unit").animate({opacity:'1'},1000,function(){
						$("h1.title span#dept").animate({opacity:'1'},1000);
					})
				});			
				//cl(firstNode);
				
				
				// Make a second API call to retrieve information about the posts that report to the root post
				api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug+"/reportsFull";
				//api_url = "http://danpaulsmith.com/puelia3/doc/department/"+deptSlug+"/post/"+postSlug+"/reportsFull";

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
					success: function(json2){
			
						searchJSON.nodes = [];
						
						//console.log("Finding post in question in organogram data");
						
						for(var i=0;i<json2.result.items.length;i++){
						
							if(postInQuestion._about == json2.result.items[i]._about){
								//console.log(postInQuestion);
								//console.log(json2.result.items[i]);
								postInQuestion = json2.result.items[i];
							}
						}
						
						/*
						// If the post reports to someone, establish the organogram's root node
						if(typeof postInQuestion.reportsTo != 'undefined'){
							// loop through organogram posts
							for(var i=0;i<json2.result.items.length;i++){
								
								// if one of the posts doesn't report to anyone (a Perm Sec)
								if(typeof json2.result.items[i].reportsTo == 'undefined' && typeof json2.result.items[i].label != 'undefined'){
									
									// check it is one of the posts that the post in question reports to
									for(var j=0;j<postInQuestion.reportsTo.length;j++){
										
										console.log("if "+postInQuestion.reportsTo[j]._about +" == "+ json2.result.items[i]._about);
										//console.log("does it report to anyone? "+postInQuestion.reportsTo[j].reportsTo);
										
										if(postInQuestion.reportsTo[j]._about == json2.result.items[i]._about) {
										
											firstNode = makeNode(json2.result.items[i]);
										
										} else if(typeof postInQuestion.reportsTo[j].reportsTo != 'undefined'){
										
											//console.log(postInQuestion.reportsTo[j].label[0]+" reports to "+postInQuestion.reportsTo[j].reportsTo[0].label[0]);
											postInQuestion = postInQuestion.reportsTo[j];
										
											j=j-1;
										
										} else {
											// nowt
										}
									}								
								}
							}		
						} else {
							firstNode = makeNode(postInQuestion);
						}	
						*/
						
						if(typeof postInQuestion.reportsTo != 'undefined') {
							for(var j=0;j<postInQuestion.reportsTo.length;j++){
								
								//console.log("postInQuestion:");
								//console.log(postInQuestion);
								//console.log("if "+postInQuestion.reportsTo[j]._about +" == "+ json2.result.items[i]._about);
								//console.log("does it report to anyone? "+postInQuestion.reportsTo[j].reportsTo);
								
								// If the post reports to a post that reports to someone that has a label
								// traverse onwards into that reporting post as the next post to be checked
								if(typeof postInQuestion.reportsTo[j].reportsTo != 'undefined' && postInQuestion.reportsTo[j].label != 'undefined' && typeof postInQuestion.reportsTo[j]._about != 'undefined'){
								
									//console.log(postInQuestion.reportsTo[j].label[0]+" reports to "+postInQuestion.reportsTo[j].reportsTo[0].label[0]);
									postInQuestion = postInQuestion.reportsTo[j];
								
									j=j-1;
								// If the post reports to a post that doesn't report to anybody with a label
								} else {
									// nowt
									//console.log("making firstNode using:");
									//console.log(postInQuestion.reportsTo[j]);
									firstNode = makeNode(postInQuestion.reportsTo[j]);
								}
							}
						} else {
							firstNode = makeNode(postInQuestion);						
						}
						
						//console.log("firstNode: "+firstNode.data.uri);			
																	
						searchJSON.reportsTo(json2.result.items,firstNode.data.uri);
						firstNode.children = searchJSON.nodes;
			
						// Build the tree using the "topmost" post found previously.
						postTree = buildTree(json2,firstNode);
						searchJSON.groupSamePosts(postTree,false);
			
						//cl(postTree);
						global_postJSON = postTree;
			
						// load json data
						global_ST.loadJSON(global_postJSON);
						// compute node positions and layout
						// global_ST.initialise();
						global_ST.compute();
			
						// cl(global_ST.canvas.getPos(true));
			
						// global_ST.canvas.scale(1,1,false);
						global_ST.canvas.translate(-150-(global_ST.canvas.translateOffsetX),-200-(global_ST.canvas.translateOffsetY),false)
			
			//var slug = firstNode.id.split("/");
			//slug = slug[slug.length-1];
						//var node = global_ST.graph.getNode("post_"+global_post);
						
						//$("div#"+global_ST.root).click();
						//global_ST.setRoot("post_"+global_post);
						global_ST.onClick(global_ST.root);
						
						setTimeout(function(){
							$("div.post_"+global_post).click();
							
						},1000);
						
						// end
						
						displayDataSources();
						
						$("h1.title span#unit").click(function(){
							window.location = $(this).attr("rel");
						});				
						$("h1.title span#dept").click(function(){
							window.location = $(this).attr("rel");
						});	
					}
				});
				
			}catch(e){
				// No success when retrieving information about the root post
				cl(e);
			}
		}
	});

	return false;
}



function buildTree(apiResult,jsonObj) {

	if( typeof jsonObj == "object" ) {
		$.each(jsonObj, function(k,v) {
			 //cl(k);
			 //cl(v);
			 //p("___________________________________________");
			// k is either an array index or object key
			if(typeof k == "number" && typeof v == "object" && v.data != undefined){
				// if node.processed == false
				// find the children nodes + join
				// else
				// skip
				if(!v.data.processed) {

					// p("Adding children to: "+v.name);

					// traverse API result tree
					$.each(apiResult.result.items, function(key,val) {

						if(typeof val == 'object' && typeof val.reportsTo != 'undefined') {
							
							// This step is probably far too recursive as the API
							// returns the posts that report to a post for every post
							// (i.e. duplicate posts). A better test would be to see
							// if a post with a new ID has been found.
							//
							// p("Found post: "+val.label);

							// search JSON tree for nodes that reportsTo this
							// one
							
							// FIX: Why is the whole API JSON structure being passed each time?
							// seems like a useless each-loop
							searchJSON.nodes = [];
							searchJSON.reportsTo(apiResult.result.items,v.data.uri);

							v.children = searchJSON.nodes;

						}
					});		

					v.data.processed = true;
					// cl(v);
				} else {
					// node already processed
					// p(v.name+' has already been processed');
				}
			}
			buildTree(apiResult,v);
		});
	}
	else {
		// jsonOb is a number or string
	}

	return jsonObj;
}


var searchJSON = {
		nodes:[],
		reportsTo:function(jsonObj,postID) {

			// p("Looking for children of postID: "+postID);

			if( typeof jsonObj == "object" ) {
				$.each(jsonObj, function(k,v) {

					if(typeof v == "object" && typeof k == "number") {

						// Make sure this object has a reportsTo value.
						// If any other values aren't present - they can be handled when 
						// displaying the information
						if(typeof v.reportsTo != 'undefined'){
						
						//p("Key: "+k);
						//p("about: "+v._about);
						//p("label: "+v.label[0]);
						//p("heldby: "+v.heldBy[0].name);
						//p("postIn: "+v.postIn[0]._about);
						//p("reportsTo.length: "+v.reportsTo.length);
						//p("-------------------------------------------");
						
						// Pass the API's post to the make node function,
						// this will then deal with the dualities such as labels,
						// postIn's and reportsTo's.
						//
						// This stage perhaps needs to loop through the post's reportsTo's
							
						// FIX: Issue with posts that report to more than one post
						// 
						for(var i=0;i<v.reportsTo.length; i++){
						//for(var i=0;i<1; i++){	 							 
							 // Handle posts that report to themselves
							if(typeof v.reportsTo[i]._about != 'undefined'){
							
								if(v.reportsTo[i]._about == undefined && v.reportsTo[i].indexOf(postID) >= 0) {
									// p("reportsTo is undefined");
									// p(v.reportsTo.indexOf(postID));
									searchJSON.nodes.push(makeNode(v));
								} else if (v.reportsTo[i]._about != undefined && v.reportsTo[i]._about.indexOf(postID) >= 0) {
									// p("Match! reportsTo:"+v.reportsTo._about);
									// p(v.reportsTo._about.indexOf(postID));
									searchJSON.nodes.push(makeNode(v));
								} else {
									// p("reportsTo: "+v.reportsTo._about);
								}
								
								//i=v.reportsTo.length-1;
							
							} else {
								//cl(v.reportsTo[i]._about+" == undefined");
							}							 
							 
						}
						searchJSON.reportsTo(v,postID); 
						}
					}

				});
			} else {
				// p("jsobObj is not an object");
			}
		},
		groupSamePosts:function(jsonObj,firstNodeFound) {
		
			if( typeof jsonObj == "object" ) {
				$.each(jsonObj, function(k,v) {
					//p("k");
					//cl(k);
					//p("v");
					//cl(v);
					//p("-----------------");
					
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
										//for(var a=0;a<v.children[i].name.length;a++){
											//for(var b=0;b<v.children[j].name.length;b++){
												if(v.children[i].name[0] == v.children[j].name[0] && v.children[i].children.length < 1 && v.children[j].children.length < 1) {
												//p(v.children[i].name[0]+" == "+v.children[j].name[0]+" AND "+v.children[i].children.length+" < 1 AND "+v.children[j].children.length+" < 1 .....");
												//p("v.children[j("+j+")].data.heldBy");
												//console.log(v.children[j].data.heldBy);
												//console.log();
												
												//p("for c=0; c<"+v.children[j].data.heldBy.length+";c++");
												
													for(var c=0;c<v.children[j].data.heldBy.length;c++){
														v.children[i].data.heldBy.push(v.children[j].data.heldBy[c]);
													}
													v.children.splice(j,1);
													j=j-1;
												}	
											//}
										//}
									}
								}
							}
						}
					}
					
					searchJSON.groupSamePosts(v,firstNodeFound); 
				});
			}		
		},
		addGroupedChildren:function(jsonObj) {

			if( typeof jsonObj == "object" ) {
				$.each(jsonObj, function(k,v) {
					//	p("k");
					//	cl(k);
					//	p("v");
					//  cl(v);
					if(typeof k == "number" && v.data != undefined) {
						if(v.data.heldBy.length > 1) {
							//p("Found grouped node: "+v.name);

							var nodesOldChildren = [];

							for(var a=0;a<v.children.length;a++) {
								nodesOldChildren.push(v.children.pop());
							}

							v.children = [];

							for(var b=0;b<v.data.heldBy.length;b++) {
								v.children.push(makePersonNode(v.data.heldBy[b]));
							}

							for(var i=0;i<v.children.length;i++){
								for(var j=0;j<nodesOldChildren.length;j++){
									for(var k=0;k<nodesOldChildren[j].data.heldBy.length;k++){
										if(nodesOldChildren[j].data.heldBy[k].reportsToPostURI == v.children[i].data.holdsPostURI) {
											for(var l=0;l<v.children[i].children.length;l++) {
												if(v.children[i].children[l].name == nodesOldChildren[j].name) {
													v.children[i].children.push(copyNode(nodesOldChildren[j]));
												}
											}
										}
									}
								}
							}

						}
					}

					searchJSON.addGroupedChildren(v);            
				});
			} else {
				// p("jsobObj is not an object");
			}

		}

} // end searchJSON

function makeNode(item) {

	//p("Making node");
	//p("------------------------");
	//cl(item);
	
	var slug = item._about.split("/");
	slug = slug[slug.length-1];
		
		var node = {
				id:$.generateId(),
				//id:"post_"+slug,
				name:[],
				data:{
					uri:item._about,
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
		
		//p("made node:");
		//cl(node);

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


function makePersonNode(heldByItem) {

	var node = {
			id:''+$.generateId(),
			name:heldByItem.foafName,
			data:{
				type:"Person",
				heldBy:[],
				processed:true,
				holdsPostURI:heldByItem.holdsPostURI,
				reportstoPostURI:heldByItem.reportsToPostURI
			},
			children:[]
	};

	return node;

}


function loadPersonInfo(node){
			
	var postID = node.data.uri.split("/");
	postID=postID[postID.length-1];
	var postUnit;
	var tempUnitID;
	var tempUnitLabel;
	
	for(var j=0;j<node.data.postIn.length;j++){
		if(node.data.postIn[j]._about.indexOf("/unit/") >= 0){
			tempUnitID = node.data.postIn[j]._about.split("/");
			tempUnitID = tempUnitID[tempUnitID.length-1];
			tempUnitLabel = node.data.postIn[j].label[0];
			postUnit = node.data.postIn[j]._about;
		}
	}

	
	// Construct the HTML for the infobox
	var html = '<h1>'+node.name+'</h1>';			
	html += '<div class="panel heldBy">';
	html += '<h3>Held By :</h3>';

	for(var i=0; i<node.data.heldBy.length; i++) {
		html += '<div class="expander">';
		
		if(typeof node.data.heldBy[i].foafName != 'undefined' && node.data.heldBy[i].foafName != ''){
			html += '<a class="name">'+node.data.heldBy[i].foafName+'<span>+</span></a>';
		}else {
			html += '<a class="name">?<span>+</span></a>';		
		}

		html += '<div class="content">';
		
		if(typeof node.data.heldBy[i].comment != 'undefined' && node.data.heldBy[i].comment.toString().length > 1){
			html+='<p class="comment"><span>Comment</span>'+node.data.heldBy[i].comment+'</p>';
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
						
		html += '<p class="salaryReports"><span>Combined salary of reporting posts </span>Checking...<img class="salaryReports" width="14" height="14" src="images/loading.gif"></p>';
			
		if(typeof node.data.type != 'undefined'){
			for(var a=0;a<node.data.type.length;a++){
				html += '<p class="type"><span>Type</span>'+node.data.type[a]+'</p>';
			}
		}
		
		var tempID = node.data.heldBy[i].holdsPostURI.split("/");
		tempID = tempID[tempID.length-1];
		
		html+= '<p class="id"><span>Post ID</span><a target="_blank" href="http://reference.data.gov.uk/id/department/'+global_department+'/post/'+tempID+'">'+tempID+'</a> <a class="view_org" href="?dept='+global_department+'&post='+tempID+'">[View organogram]</a></p>';
		
		html+= '<p class="unit"><span>Unit(s)</span>';
		
		html+= '<a target="_blank" href="http://reference.data.gov.uk/id/department/'+global_department+'/unit/'+tempUnitID+'">'+tempUnitLabel+'</a>';
		
		html+= '</p>';
		
		html+= '<span class="external_posts_title">External reporting posts:</span>';
		html+= '<ul class="external_posts"></ul>';

		html += '</div><!-- end content -->';
		html += '<div class="clear"><!-- --></div>';
		html += '</div><!-- end expander -->';
		
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
		$("div.heldBy div.expander a").eq(0).click(); 
		
		displaySalaryReports(node,postUnit);
	
} // end loadPersonInfo

var test;

function displaySalaryReports(node,postUnit) {

	postUnit = postUnit.split("/");
	postUnit = postUnit[postUnit.length-1];
	var postLabel = node.name.toString().replace(/ /g,"+");

	// Make an API call to retrieve information about the root post
	//var api_url = "http://reference.data.gov.uk/doc/department/"+global_department+"/post/"+postID+"/statistics";
	var api_url = "http://reference.data.gov.uk/doc/department/"+global_department+"/unit/"+postUnit+"/statistics";

	// Call API for post statistics	
	$.ajax({
		url: api_url+".json?aboutPost.label="+postLabel+"&callback=?",
		type: "GET",
		dataType: "jsonp",
		async:false,
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
									$("div.expander div.content").each(function(){
										if($(this).children("p.id").children("a").attr("href") == node.data.heldBy[v].holdsPostURI.toString()) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><a target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">£'+node.data.heldBy[v].salaryCostOfReports+'</a> <span class="date">'+node.data.heldBy[v].salaryCostOfReportsDate+'</span>');
										}
									});					
								} else {
									$("div.expander div.content").each(function(){
										if($(this).children("p.id").children("a").attr("href") == node.data.heldBy[v].holdsPostURI) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><a target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">N/A</a>');
										}
									});								
								}									
							}
						}
					}
					
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
						parameters:'?aboutPost.label='+postLabel
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
	
	resetSourceLinks();
	
	$('div#apiCalls').fadeIn();
		
	return false;
}
