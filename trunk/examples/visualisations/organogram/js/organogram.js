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

	// A client-side tree generator
	
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
	/*
	* Top: offsetX:0, node height:40,
	* Left: offsetX:300, node height:70,
	*
	*/
	var st = new $jit.ST({  
		'injectInto': 'infovis', 
		Navigation: {  
			enable: true,  
			panning: 'avoid nodes',  
			zooming: 40
		}, 
		// set duration for the animation
		duration: 300,
		orientation: 'top',
		offsetX: 0,  
		offsetY: 0, 
		// set animation transition type
		transition: $jit.Trans.Sine.easeOut, 
		// set distance between node and its children
		levelDistance: 60,  
		// set max levels to show. Useful when used with
		// the request method for requesting trees of specific depth
		levelsToShow: 2,  
		// set node and edge styles
		// set overridable=true for styling individual
		// nodes or edges
		Node: {
			height: 70,
			width: 190,
			// autoHeight: true,
			// autoWidth: false,
			// use a custom
			// node rendering function
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

		// Add a request method for requesting on-demand json trees.
		// This method gets called when a node
		// is clicked and its subtree has a smaller depth
		// than the one specified by the levelsToShow parameter.
		// In that case a subtree is requested and is added to the dataset.
		// This method is asynchronous, so you can make an Ajax request for that
		// subtree and then handle it to the onComplete callback.
		// Here we just use a client-side tree generator (the getTree function).
		request: function(nodeId, level, onComplete) {  
			var ans = getTree(nodeId, level);  
			onComplete.onComplete(nodeId, ans);    
		},  

		onBeforeCompute: function(node){  
			// Log.write("loading " + node.name);
			// st.canvas.translate(0-(global_ST.canvas.translateOffsetX),7-(global_ST.canvas.translateOffsetY),false)

		},  

		onAfterCompute: function(){  
			changeLog("Done",false);
			hideLog(); 
		},  

		// This method is called on DOM label creation.
		// Use this method to add event handlers and styles to
		// your node.
		onCreateLabel: function(label, node){ 
			$(label).addClass(node.data.grade[0]); 
			label.id = node.id;        
			
			for(var i=0;i<node.name.length;i++){
				label.innerHTML += node.name[i]+", ";
			}
			label.innerHTML = label.innerHTML.substring(0,label.innerHTML.length-2);
			
			label.innerHTML = label.innerHTML + '<span class="postIn">'+node.data.postIn[0].label[0]+'</span>';
			
			if(node.data.heldBy.length>1){
				label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.heldBy.length+'</span>';
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
					$("#infobox").html(loadPersonInfo(node));
					setInfoBoxLinks();
					$("#infobox").fadeIn();
					$("div.heldBy a").eq(0).click(); 
				});

			};  

			// set label styles
			var style = label.style;
			style.width = 180 + 'px';
			style.height = 'auto';            
			style.cursor = 'pointer';
			style.color = '#000000';
			// style.backgroundColor = '#1a1a1a';
			style.fontSize = '0.8em';
			style.textAlign= 'center';
			style.textDecoration = 'none';
			style.paddingTop = '3px'; 
		},  

		// This method is called right before plotting
		// a node. It's useful for changing an individual node
		// style properties before plotting it.
		// The data properties prefixed with a dollar
		// sign will override the global node style properties.
		onBeforePlotNode: function(node){  
			// add some color to the nodes in the path between the
			// root node and the selected node.
			if (node.selected) {  
				node.data.$color = "ff7";  
			}  
			else {  
				delete node.data.$color;  
			}  
		},  

		// This method is called right before plotting
		// an edge. It's useful for changing an individual edge
		// style properties before plotting it.
		// Edge data proprties prefixed with a dollar sign will
		// override the Edge global style properties.
		onBeforePlotLine: function(adj){
			if (adj.nodeFrom.selected && adj.nodeTo.selected) {
				adj.data.$color = "#DE5B06";
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

	var firstNode;	
	//$("div#formats").fadeOut();
	$('div#apiCalls').fadeOut();
	
	// Make an API call to retrieve information about the root post
	var api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug;
	// Description of API call
	api_call_info.push({
		title:"Retrieval of root post information",
		description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
		url:api_url,
		parameters:"?callback=?"
	});
	
	$.ajax({
		url: api_url+".json",
		type: "GET",
		dataType: "jsonp",
		async:true,
		success: function(json){
				
				try{
				
				firstNode = makeNode(json.result.primaryTopic);
				$("h1.title span#post").html(json.result.primaryTopic.label[0].toString().replace("@en",""));
				$("h1.title span#unit").html(json.result.primaryTopic.postIn[0].label[0].toString().replace("@en",""));
				$("h1.title span#dept").html(json.result.primaryTopic.postIn[1].label[0].toString().replace("@en",""));
				$("h1.title span").css("visibility","visible");
				$("h1.title span#post").animate({opacity:'1'},1000,function(){
					$("h1.title span#unit").animate({opacity:'1'},1000,function(){
						$("h1.title span#dept").animate({opacity:'1'},1000)
					})
				});			
				//cl(firstNode);
				
				// Make a second API call to retrieve information about the posts that report to the root post
				api_url = "http://reference.data.gov.uk/doc/department/"+deptSlug+"/post/"+postSlug+"/reports";
				api_call_info.push({
					title:"Retrieval of posts that report to the root post",
					description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
					url:api_url,
					parameters:"?_pageSize=300&callback=?"
				});				
				
				$.ajax({
					url: api_url+".json"+api_call_info[1].parameters,
					type: "GET",
					dataType: "jsonp",
					async:true,
					success: function(json){
			
						searchJSON.nodes = [];			
						searchJSON.reportsTo(json.result.items,firstNode.data.uri);
						firstNode.children = searchJSON.nodes;
			
						// Build the tree using the "topmost" post found previously.
						postTree = buildTree(json,firstNode);
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
						global_ST.canvas.translate(-150-(global_ST.canvas.translateOffsetX),-120-(global_ST.canvas.translateOffsetY),false)
			
						// emulate a click on the root node.
						// global_ST.onClick(global_ST.json.children[0].id);
						//global_ST.onClick(global_ST.root);
						$("div#"+global_ST.root).click();
						// end
						
						displayDataSources();
					}
				});
				
			}catch(e){
				// No success when retrieving information about the root post
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

			/*
			 * go through tree of grouped nodes
			 * 
			 * if (node is grouped) { 
			 * pop() the node's children temporarily. create
			 * node's children using it's heldBy people [including their postURIs].
			 * 		for(i number of node's current children) {
			 * 	 		for(j number of popped children) { 
			 * 				for(k popped child's heldBy items) { 
			 * 					if (popped child's [j] heldBy item [k] reportsTo = node's child's [i] postURI) { 
			 * 						create new node using popped node [j] and push() to node child's [i]
			 * 						children. add heldBy item [k] to the new node. 
			 * 						// need to check if the post node already exists beneath a person node before 
			 * 						// creating a new one. 
			 * 						// the grouped badge also needs to be added to the post node using its heldBy info. 
			 * } } } } }
			 */

			if( typeof jsonObj == "object" ) {
				$.each(jsonObj, function(k,v) {
//					p("k");
//					cl(k);
//					p("v");
//					cl(v);
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

										// p("Does the heldBy of the grouped post report
										// to a child node?");
										// p(nodesOldChildren[j].data.heldBy[k].reportsToPostURI
										// +" == "+ v.children[i].data.holdsPostURI + "
										// ?");

										if(nodesOldChildren[j].data.heldBy[k].reportsToPostURI == v.children[i].data.holdsPostURI) {

											// p("here");

											// check to see if post node exists
											// beneath person first

											/* if(v.children[i].children.length > 0) { */
											for(var l=0;l<v.children[i].children.length;l++) {

												// p("Does post node exist
												// beneath person node?");
												// p(v.children[i].children[l].name+"
												// ==
												// "+nodesOldChildren[j].name);

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
	
		var node = {
				id:$.generateId(),
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
					comment:""
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

	var html = '<h1>'+node.name+'</h1>';
	
	html += '<div id="people">';
	html += '<h3>Held By :</h3>';

	for(var i=0; i<node.data.heldBy.length; i++) {
		html += '<div class="heldBy">';
		
		//p("foafName");
		//cl(node.data.heldBy[i].foafName);
		
		if(typeof node.data.heldBy[i].foafName != 'undefined' && node.data.heldBy[i].foafName != ''){
			html += '<a class="name">'+node.data.heldBy[i].foafName+'<span>+</span></a>';
		}else {
			html += '<a class="name">?<span>+</span></a>';		
		}

		html += '<div class="personInfo">';
		//html += '<img src="images/photo_placeholder.png" />';
		
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

		if(typeof node.data.type != 'undefined'){
			for(var a=0;a<node.data.type.length;a++){
				html += '<p class="type"><span>Type</span>'+node.data.type[a]+'</p>';
			}
		}
		
		var tempID = node.data.heldBy[i].holdsPostURI.split("/");
		tempID = tempID[tempID.length-1];
		
		html+= '<p class="id"><span>Post ID</span><a target="_blank" href="http://reference.data.gov.uk/doc/department/'+global_department+'/post/'+tempID+'">'+tempID+'</a></p>';
		
		html+= '<p class="unit"><span>Unit(s)</span>';
		
		for(var j=0;j<node.data.postIn.length;j++){
			if(node.data.postIn[j]._about.indexOf("/unit/") >= 0){
				var tempUnitID = node.data.postIn[j]._about.split("/");
				tempUnitID = tempUnitID[tempUnitID.length-1];
				html+= '<a target="_blank" href="http://reference.data.gov.uk/doc/department/'+global_department+'/unit/'+tempUnitID+'">'+node.data.postIn[j].label[0]+'</a>';
			}
		}
		
		html+= '</p>';
		
		html+= '<span class="external_posts_title">External reporting posts:</span>';
		html+= '<ul class="external_posts"></ul>';

		html += '</div>';
		html += '<div class="clear"><!-- --></div>';
		html += '</div>';

	}

	html+= '</div><!-- end people -->';
	html+= '<a class="close">x</a>';
		
	return html;
}



function displayDataSources() {
	
	var html='';
	
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
	
	
	
	$('div#apiCalls').html($('div#apiCalls').html()+html);
	
	resetSourceLinks();
	
	$('div#apiCalls').fadeIn();
		
	return false;
}
