/*
Treemap visualisation from the JIT.
http://thejit.org/

Modified by Dan Smith for the Organogram 
visualisation.

treemapvis

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
$.generateId.prefix = 'node';
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
var global_TM="";
var global_deptJSON="";
var includeDeputyDirectors=false;
var api_call_info = [];

function init(){
	
	loadDepts();

 	var tm = new $jit.TM.Squarified({  
	   //where to inject the visualization  
	   injectInto: 'infovis',  
	   //parent box title heights  
	   titleHeight: 30,  
	   //enable animations  
	   animate: false,  
	   //box offsets  
	   offset: 0, 
	   levelsToShow: 2, 
	   //Attach left and right click events   	   
	   Events: {  
	     enable: true,  
	     onClick: function(node) {  
	       //console.log("clicked on node");
	       if(typeof node.data != 'undefined' && node.data.type == "Post") {
	       	var postSlug = node.data.uri.split("/");
	       	var deptSlug = "";
	       	for(var i=0;i<postSlug.length;i++){
	       		if(postSlug[i] == "department") {
	       			deptSlug = postSlug[i+1];
	       		}
	       	}
	       	postSlug = postSlug[postSlug.length-1];
	       	//if(deptSlug == "bis" || deptSlug == "hmrc"){
	       		window.location = "../organogram?dept="+deptSlug+"&post="+postSlug;
	       	//} else {
	       	//	showLog("Sorry, this organogram is under construction. The BIS and HMRC organogram data is live. ");
	       	//	setTimeout(function() {hideLog();},3000);
	       	//}
	       } else if(node) {
	       	tm.enter(node);
	       }
	       /* else if(node.data.type == "Unit") {
	       	var unitSlug = node.data.uri.split("/");
	       	unitSlug = unitSlug[unitSlug.length-1];
	       	window.location = "http://danpaulsmith.com/gov/orgvis_unitview?dept="+deptSlug+"&unit="+unitSlug;
	       }
	       */
	     },  
	     onRightClick: function() {  
	       tm.out();  
	     }  
	   },  
	   duration: 300,
	   cushion: useGradients,
	   //Enable tips  
	   Tips: {  
	     enable: true,  
	     //add positioning offsets  
	     offsetX: 20,  
	     offsetY: 20,  
	     //implement the onShow method to  
	     //add content to the tooltip when a node  
	     //is hovered  
	     onShow: function(tip, node, isLeaf, domElement) {  
	       var html = "<div class=\"tip-title\">" + node.name.valueOf()   
	         + "</div><div class=\"tip-text\">";  
	       var data = node.data;  
	       if(data.playcount) {  
	         html += "play count: " + data.playcount;  
	       }  
	       if(data.image) {  
	         html += "<img src=\""+ data.image +"\" class=\"album\" />";  
	       }  
	       tip.innerHTML =  html;   
	     }    
	   },  
	   //Add the name of the node in the correponding label  
	   //This method is called once, on label creation.  
	   onCreateLabel: function(domElement, node){  
	   	   $(domElement).addClass(node.data.type);
	       domElement.innerHTML = node.name.valueOf();
	       var style = domElement.style;  
	       style.display = '';  
	       style.color = node.data.text;
	       //style.border = '1px solid transparent';  
       domElement.onmouseover = function() {  
         style.border = '1px solid #FFFFFF';  
       };  
       domElement.onmouseout = function() {  
         style.border = '1px solid transparent';  
       };  
	   }  
	 });  
	 
	 global_TM = tm;
 
} // end init


/*
 *
 */
function loadDepts() {

	showLog("Loading departments ...");

	var postList = new Array();
	
	var api_url = "http://danpaulsmith.com/puelia2/doc/department";
	
	$("div#formats").fadeOut();
	
	// Description of API call
	api_call_info.push({
		title:"Retrieves a list of all departments",
		description:"A specific API Viewer is needed to pull through each departments' units, the posts within those units and the posts that report to those posts.",
		url:api_url,
		parameters:"?_view=departmentWithPosts&_pageSize=100&_properties=unit.post.reportsTo"
	});	
	
	$.ajax({
		url: api_call_info[0].url+".json"+api_call_info[0].parameters,
		type: "GET",
		dataType: "json",
		async:true,
		success: function(json){
		
			
			// dept
			// dept
			// -- unit
			// -- unit
			// -- unit
			// ---- post
			// ---- post
			// -- unit
			// dept
			// dept
			
			// Connect the departments to the government node
			
			global_govJSON = makeGovNode();
			
			var depts = json.result.items;
			var tempDeptNode = {};
			var tempUnitNode = {};
			
			// Loop through department resources
			for(var i=0; i<depts.length; i++) {
				// If a department resource has enough information
				if(typeof depts[i]._about != 'undefined' && typeof depts[i].prefLabel != 'undefined') {
					// Make a department node
					tempDeptNode = makeDeptNode(depts[i]);
					// If the department has units
					if(typeof depts[i].unit != 'undefined') {
						// Loop through the department's units
						for(var j=0;j<depts[i].unit.length;j++) {4
							// If the department's unit has posts
							if(typeof depts[i].unit[j].post != 'undefined') {
								// Make a unit node
								tempUnitNode = makeUnitNode(depts[i].unit[j]);
								// Loop through the unit's posts	
								for(var k=0;k<depts[i].unit[j].post.length;k++){
									// Skip any posts that are "Deputy Directors"
									//if(typeof depts[i].unit[j].post[k].type != 'undefined' && depts[i].unit[j].post[k].type[0].toString().indexOf("Deputy") < 0) {
										// Make a post node and connect to the unit									
										tempUnitNode.children.push(makePostNode(depts[i].unit[j].post[k]));
										tempUnitNode.data.$area = tempUnitNode.children.length;
									//} else if(includeDeputyDirectors) {
									//	tempUnitNode.children.push(makePostNode(depts[i].unit[j].post[k]));
									//	tempUnitNode.data.$area = tempUnitNode.children.length;										
									//}
								}
							} else {
								// Make a unit node
								tempUnitNode = makeUnitNode(depts[i].unit[j]);						
							}
							// Connect the unit node to the department
							tempDeptNode.children.push(tempUnitNode);
							tempDeptNode.data.$area = tempDeptNode.children.length;
						}
					} else {
						// The department has no units
					}
				}
				global_govJSON.children.push(tempDeptNode);			
			}
			
			
			p("Government:");
			//console.log(global_govJSON);
			

			
/*
			$.ajax({
				url: "http://danpaulsmith.com/puelia2/doc/department/"+deptSlug+"/tier2post.json",
				type: "GET",
				dataType: "json",
				async:true,
				success: function(json){

				}
			});
			
			// Connect the units to the department
			var posts = json.result.items;
			var deptNodeCreated = false;
			for(var i=0; i<posts.length; i++) {
				for(var j=0;j<posts[i].postIn.length;j++){
					if(posts[i].postIn[j]._about.toString().indexOf("unit") < 0 && !deptNodeCreated) {
						
						p("Creating department node using: "+posts[i].postIn[j]._about.toString());
						global_deptJSON = makeDeptNode(posts[i].postIn[j]);
						
						if(j==0){
							p("Creating unit node using: "+posts[i].postIn[1]._about.toString());
							global_deptJSON.children.push(makeUnitNode(posts[i].postIn[1]));						
						} else {
							p("Creating unit node using: "+posts[i].postIn[0]._about.toString());
							global_deptJSON.children.push(makeUnitNode(posts[i].postIn[0]));						
						}
						deptNodeCreated = true;
						
					} else if(posts[i].postIn[j]._about.toString().indexOf("unit") > 0 && deptNodeCreated) {
						p("Creating unit node using: "+posts[i].postIn[j]._about.toString());
						global_deptJSON.children.push(makeUnitNode(posts[i].postIn[j]));				
					}
				}
				
			}

			
			cl(global_deptJSON.children.length);
			
			//Check for duplicate unit nodes using a destructive splice
			for(i=0;i<global_deptJSON.children.length-1;i++){
				for(j=i+1;j<global_deptJSON.children.length;j++){
					if(global_deptJSON.children[i].data.uri == global_deptJSON.children[j].data.uri) {
						global_deptJSON.children.splice(j,1);
						j=j-1;
					}
				}
			}
			
			cl(global_deptJSON.children.length);
			
			
			
			// Connect the posts to the units
			for(i=0;i<posts.length;i++){
				for(j=0;j<posts[i].postIn.length;j++){
					for(k=0;k<global_deptJSON.children.length;k++){
						if(posts[i].postIn[j]._about == global_deptJSON.children[k].data.uri){
							global_deptJSON.children[k].children.push(makePostNode(posts[i]));
						}
					}
				}
			}
			
			cl(global_deptJSON);
			
			global_TM.loadJSON(global_deptJSON);  
			global_TM.refresh(); 
*/
			
			global_TM.loadJSON(global_govJSON);  
			global_TM.refresh(); 
			
			displayDataSources();
			
			hideLog();

		}
	});

	return false;
}

function makePostNode(item){
	var node = {
			id:$.generateId(),
			name:item.label[0].toString().replace("@en",""),
			data: {
				type:"Post",
				uri:item._about,
				processed:false,
             	$color: "#888888", 
             	text: "#FFFFFF",
             	$area: 1			
			},
			children:[]
	};
	return node;
}
function makeUnitNode(item){
	var node = {
			id:$.generateId(),
			name:item.label[0].replace("@en",""),
			data: {
				type:"Unit",
				uri:item._about,
				processed:false,
             	$color: "#819C9B",
             	text: "#FFFFFF", 
             	$area: 1							
			},
			children:[]
	};
	return node;
}
function makeDeptNode(item){
	var node = {
			id:$.generateId(),
			name:item.prefLabel.toString().replace("@en",""),
			data: {
				type:"Department",
				uri:item._about,
				processed:false,
             	$color: "#DE5B06",
             	text: "#FFFFFF", 
             	$area: 1	
			},
			children:[]
	};
	return node;
}
function makeGovNode(){
	var node = {
			id:$.generateId(),
			name:"Her Majesty's Government",
			data: {
				$color: "#333333",
				type: "Government"
			},
			children:[]
	};
	return node;
}
function displayDataSources() {
	
	var html='';
	
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
	
	$('div#apiCalls').html($('div#apiCalls').html()+html);
	
	resetSourceLinks();
	
	$('div#apiCalls').fadeIn();
		
	return false;
}