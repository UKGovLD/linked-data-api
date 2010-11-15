/*
Treemap visualisation from the JIT.
http://thejit.org/

Modified by @danpaulsmith for the Government Overview 
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
var sizeByUnits = true;
var sizeByPosts = false;
var postReportTos = [];

function init(){
	
	api_call_info = [];
	$('div#apiCalls').hide();
	$("a.source").remove();
	$('div.apiCall').remove();
	
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
	   levelsToShow: 1, 
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
	       //restyle();
	     },  
	     onRightClick: function() {  
	       tm.out();  
	       //restyle();
	     }  
	   },  
	   duration: 300,
	   cushion: useGradients,
	   //Enable tips  
	   Tips: {  
	     enable: true,  
	     //add positioning offsets  
	     offsetX: 20,  
	     offsetY: 40,  
	     //implement the onShow method to  
	     //add content to the tooltip when a node  
	     //is hovered  
	     onShow: function(tip, node, isLeaf, domElement) {  
	       var html = "<div class=\"tip-title\">" +node.name.valueOf()+ "</div>";
	       //<div class=\"tip-text\">";  
	       //var data = node.data;  
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
	
	// Description of API call
	api_call_info.push({
		title:"Retrieves a list of all departments",
		description:"A specific API Viewer is needed to pull through each departments' units, the posts within those units and the posts that report to those posts.",
		url:"http://reference.data.gov.uk/doc/department",
		parameters:"?_view=minimal&_properties=unit.label,unit.post.label,unit.post.reportsTo&_pageSize=100"
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
			// ---- post (Deputy 1)
			// ------ reportsTo (Director)
			// -------- reportsTo (Director General)
			// ---------- reportsTo (Permanent Secretary)
			// ---- post (Deputy 2)
			// ------ reportsTo (Director)
			// -------- reportsTo (Director General)
			// ---------- reportsTo (Permanent Secretary)
			// ---- post (Deputy 3)
			// ------ reportsTo (Director)
			// -------- reportsTo (Director General)
			// ---------- reportsTo (Permanent Secretary)
			// -- unit
			// dept
			// dept

			
			// Connect the departments to the government node
			
			global_govJSON = makeGovNode();
			
			var depts = json.result.items;
			var tempDeptNode = {};
			var tempDeptNodeArea = 0;
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
									var reportsToCounter = 0;
									
									if(postReportTos.length<1){
										postReportTos.push({
											p:depts[i].unit[j].post[k]._about,
											r:reportsToCounter
										});										
									} else {									
										for(var w=0;w<postReportTos.length;w++){
											if(postReportTos[w].p == depts[i].unit[j].post[k]._about){
												w=postReportTos.length;
											} else if(w == postReportTos.length-1){
												postReportTos.push({
													p:depts[i].unit[j].post[k]._about,
													r:reportsToCounter
												});											
											}
										}
									}
									
									reportsToCounter++;									
									var postItem = depts[i].unit[j].post[k];
									
									while(typeof postItem.reportsTo != 'undefined') {
										
										for(var x=0;x<postReportTos.length;x++){
											if(postReportTos[x].p == postItem._about){
												postReportTos[x].r++;
											} else if(x==postReportTos.length-1){
												postReportTos.push({
													p:postItem._about,
													r:reportsToCounter
												});													
											}
										}
										postItem = postItem.reportsTo[0];
										reportsToCounter++;
									}
									
									
									// Make a post node and connect to the unit									
									tempUnitNode.children.push(makePostNode(depts[i].unit[j].post[k]));
									tempUnitNode.data.$area = tempUnitNode.children.length;
									tempDeptNodeArea += tempUnitNode.data.$area;
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
							if(sizeByUnits){
								tempDeptNode.data.$area = tempDeptNode.children.length;
							} else if(sizeByPosts){
								tempDeptNode.data.$area = tempDeptNodeArea;
							}
						}
					} else {
						// The department has no units
					}
				}
				global_govJSON.children.push(tempDeptNode);
				tempDeptNodeArea = 0;	
			}

			resizePosts(global_govJSON);

			global_TM.loadJSON(global_govJSON);  
			global_TM.refresh(); 
			
			restyle();
			
			displayDataSources();
			
			hideLog();

		}
	});

	return false;
}

function restyle(){

	$("div.node").each(function(){
		if($(this).hasClass("Department")){
			if($("div.Unit").overlaps($(this))){
				$(this).css("line-height","25px");
			} else {
				$(this).css("line-height",$(this).height()+"px");
			}
		}
		if($(this).hasClass("Unit")){
			if($("div.Post").overlaps($(this))){
				$(this).css("line-height","25px");
			} else {
				$(this).css("line-height",$(this).height()+"px");
			}			
		}
		if($(this).hasClass("Post")){
			$(this).css("line-height",$(this).height()+"px");	
		}
		
		//textFit($(this).get(0), 6, 100, $(this).width(), $(this).height());
		
	});


	$("div.node").click(function(){
		$("div.node").removeClass("root");
		$(this).addClass("root");
		if($(this).hasClass("Government")){
			
		} else if($(this).hasClass("Department")){
			
		} else if($(this).hasClass("Unit")){
			
		}
	});	

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


function resizePosts(jsonObj) {

	if( typeof jsonObj == "object" ) {
	
		$.each(jsonObj, function(k,v) {

			if(typeof k == "number" && v.data != 'undefined' && v.data.type == "Post"){
				for(var y=0;y<postReportTos.length;y++){
					if(v.data.uri == postReportTos[y].p){
						v.data.$area = postReportTos[y].r;
					}
				}					
			}
			
			resizePosts(v);
		});
	}
	else {
		// jsonOb is a number or string
	}

	return jsonObj;
}