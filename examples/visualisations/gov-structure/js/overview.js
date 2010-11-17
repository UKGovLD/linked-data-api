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
var rootNode;
var prevNode;
var deptParam="";
var unitParam="";

function init(d,u){
	
	deptParam = d;
	unitParam = u;
	
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
				$("h1.title span").css("visibility","visible");
				if(node){
				$("div#nodeTip").hide();
				prevNode = rootNode;
				rootNode = node;  				
				var tempSlug;
				if(node.data.type == "Department"){
					// Department node
					$("h1.title span#unit").animate({opacity:'0'},500);
					tempSlug = node.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title span#dept").html(node.name.valueOf()).attr('rel',tempSlug).animate({opacity:'1'},500);
					$("h1.title span#text").click(function(){
						$("h1.title span#dept").animate({opacity:'0'},500);
						tm.out();
						global_TM.refresh();
						restyle();
						rootNode = global_govJSON;
					});
				} else if(node.data.type == "Unit"){
					// Unit node
					tempSlug = node.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title span#unit").html(node.name.valueOf()).attr('rel',tempSlug).animate({opacity:'1'},500);
					$("h1.title span#text").click(function(){
						$("h1.title span#dept").animate({opacity:'0'},500);
						$("h1.title span#unit").animate({opacity:'0'},500);					
						tm.out();
						tm.out();
						global_TM.refresh();
						restyle();
						rootNode = global_govJSON;
					});
					$("h1.title span#dept").click(function(){
						$("h1.title span#unit").animate({opacity:'0'},500);										
						tm.out();
						global_TM.refresh();
						restyle();
						rootNode = prevNode;
					});
				} else {
					// Gov node
					$("h1.title span").animate({opacity:'0'},500);
					global_TM.refresh();
					restyle();
				}

				if(typeof node.data != 'undefined' && node.data.type == "Post") {
					var postSlug = node.data.uri.split("/");
					var deptSlug = "";
					for(var i=0;i<postSlug.length;i++){
						if(postSlug[i] == "department") {
							deptSlug = postSlug[i+1];
						}
					}
					postSlug = postSlug[postSlug.length-1];

					window.location = "../organogram?dept="+deptSlug+"&post="+postSlug;

				} else if(node) {
					tm.enter(node);				
				}
				} else {
				// not a node
				}
				global_TM.refresh();		
				restyle();
				
			},  
			onRightClick: function() {
				global_TM.canvas.opt.levelsToShow = 1;
				$("div#nodeTip").hide();
				if(rootNode.data.type == "Department"){
					rootNode = global_govJSON;
				} else {
					rootNode = prevNode;				
				}
				tm.out();
				global_TM.refresh();  
				restyle();
				var tempSlug;
				if(rootNode.data.type == "Department"){
					// Department node
					$("h1.title span#post").animate({opacity:'0'},500);
					$("h1.title span#unit").animate({opacity:'0'},500);
					tempSlug = rootNode.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title span#dept").html(rootNode.name.valueOf()).attr('rel',tempSlug).animate({opacity:'1'},500);
					$("h1.title span#text").click(function(){
						tm.out();
						global_TM.refresh();
						restyle();
					});					
				} else {
					// Gov node
					$("h1.title span#dept").animate({opacity:'0'},500);
					$("h1.title span#unit").animate({opacity:'0'},500);
				}			
			}  
		},  
		duration: 300,
		cushion: useGradients,
		//Enable tips  
		Tips: {  
			enable: false,  
			//add positioning offsets  
			offsetX: 20,  
			offsetY: 40,  
			//implement the onShow method to  
			//add content to the tooltip when a node  
			//is hovered  
			onShow: function(tip, node, isLeaf, domElement) {  
				
				var html = "<div class=\"tip-title\">" +$(isLeaf).children().eq(0).html()+ "</div>";
				//<div class=\"tip-text\">";  
				//var data = node.data;  
				tip.innerHTML =  html;   
			}    
		},  
		//Add the name of the node in the correponding label  
		//This method is called once, on label creation.  
		onCreateLabel: function(domElement, node){  
			$(domElement).addClass(node.data.type);
			//domElement.innerHTML = '<div class="cell">'+node.name.valueOf()+'</div><div class="tooltip">'+node.name.valueOf()+'</div>';
			domElement.innerHTML = '<div class="outer"><div class="middle"><div class="inner">'+node.name.valueOf()+'</div></div></div><div class="tooltip">'+node.name.valueOf()+'</div>';
			
			var style = domElement.style;  
			style.display = '';  
			style.color = node.data.text;
			
			$(domElement).hover(function(e){
				$(domElement).get(0).style.border = '1px solid #FFFFFF';											  									  
				//$(this).children().filter(".tooltip").css("top",(e.pageY - 10) + "px").css("left",(e.pageX - 30) + "px").show();		
				$("div#nodeTip").html(node.name.valueOf()).css("top",(e.pageY - 100) + "px").css("left",(e.pageX - 200) + "px").show();
			},function(){
				$(domElement).get(0).style.border = '1px solid transparent'; 
				//$(this).children().filter(".tooltip").hide();
				$("div#nodeTip").html(node.name.valueOf()).hide();
			});    
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
		url: api_call_info[0].url+".json"+api_call_info[0].parameters+"&callback=?",
		type: "GET",
		dataType: "jsonp",
		async:true,
		success: function(json){

			
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
						
			rootNode = global_govJSON;
			
			$("div.node").live("mousemove",function(e){	
				if(e.pageY < 130 && e.pageX < 200){
					$("div#nodeTip").css("top",(e.pageY+30) + "px").css("left",(e.pageX+30) + "px");				
				} else if(e.pageY < 130 ) {
					$("div#nodeTip").css("top",(e.pageY+30) + "px").css("left",(e.pageX-200) + "px");						
				} else if(e.pageX < 200) {
					$("div#nodeTip").css("top",(e.pageY-100) + "px").css("left",(e.pageX+30) + "px");								
				} else {
					$("div#nodeTip").css("top",(e.pageY-100) + "px").css("left",(e.pageX-200) + "px");				
				}
			});

			if(typeof deptParam != 'undefined' && deptParam.length > 1 && (typeof unitParam == 'undefined' || unitParam.length < 1)){
				try{
					var node = global_TM.graph.getNode(deptParam);
					$("h1.title span#dept").html(node.name.valueOf()).animate({opacity:'1'},500);
					$("h1.title span").css("visibility","visible");			
					global_TM.enter(node);
					prevNode = global_govJSON;
					rootNode = node;
					$("h1.title span#text").click(function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
						$("h1.title span#dept").hide();
					});
				}catch(e){
					showLog("Department not found ...");
				}
			} else if(typeof unitParam != 'undefined' && unitParam.length > 1){
				try{
					var uNode = global_TM.graph.getNode(unitParam);
					var dNode = global_TM.graph.getNode(deptParam);
					$("h1.title span#unit").html(uNode.name.valueOf()).animate({opacity:'1'},500);			
					$("h1.title span#dept").html(dNode.name.valueOf()).animate({opacity:'1'},500);
					$("h1.title span#dept").click(function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
						rootNode = dNode;
						prevNode = global_govJSON;
						$("h1.title span#unit").hide();
					});	
					$("h1.title span#text").click(function(){
						global_TM.out();
						global_TM.out();
						global_TM.refresh();
						restyle();
						$("h1.title span#unit").hide();
						$("h1.title span#dept").hide();
					});							
					$("h1.title span").css("visibility","visible");	
					global_TM.enter(uNode);	
					prevNode = dNode;
					rootNode = uNode;	
				}catch(e){
					showLog("Unit not found ...");
				}
			}

			restyle();
									
			displayDataSources();
			
			hideLog();
			


		}
	});

	return false;
}


function restyle() {

	$("div.node").each(function(){
		var $midEl = $(this).children().eq(0).children().eq(0);
		if($(this).css("display") != "none"){ 
			if($(this).hasClass("Department")){
				if($("div.Unit").overlaps($(this))){
					$midEl.addClass("vtop");
				} else {
					$midEl.removeClass("vtop");
				}
			} else if($(this).hasClass("Unit")){
				if($("div.Post").overlaps($(this))){
					$midEl.addClass("vtop");
				} else {
					$midEl.removeClass("vtop");
				}				
			}
		}
	});


/*	

$("div.Department").each(function(){
	if($("div.Unit").overlaps($(this))){
		$(this).children().eq(0).children().eq(0).css("vertical-align","top");
	}
});
$("div.Unit").each(function(){
	if($("div.Post").overlaps($(this))){
		$(this).children().eq(0).children().eq(0).css("vertical-align","top");
	}
});
		

	$("div.node").each(function(){
	
	var $label = $(this).children().eq(0);
	
		if($(this).hasClass("Department")){
			if($("div.Unit").overlaps($(this))){
				$label.css("top","0").css("margin-top","6px");
			} else {
				$label.vAlign();
				$label.hAlign();
			}
		} else if($(this).hasClass("Unit")){
			if($("div.Post").overlaps($(this))){
				$label.css("top","0").css("margin-top","6px");			
			} else {
				$label.vAlign();
				$label.hAlign();
			}			
		} else if($(this).hasClass("Post")){
				$label.vAlign();
				$label.hAlign();
		}
		
		    
		
		$label.hAlign().hAlign().hAlign().hAlign().hAlign();
	});
	*/
}

	
var loadNode = {
	findNode:function(jsonObj,slug) {
		if( typeof jsonObj == "object" ) {
			$.each(jsonObj, function(k,v) {
				if(typeof v == "object" && typeof v.data != 'undefined'){					
					if(v.data.uri.indexOf(slug) == v.data.uri.length-slug.length){
						loadNode.node = v;
					}
				}
				loadNode.findNode(v,slug);
			});
		}
		else {
			// jsonOb is a number or string
		}
		return jsonObj;	
	},
	node:{}
}	


function makePostNode(item){
	var slug = item._about.split("/");
	slug = slug[slug.length-1];
	
	var node = {
			id:slug,
			name:item.label[0].toString().replace("@en",""),
			data: {
				type:"Post",
				uri:item._about,
				processed:false,
             	//$color: "#888888", 
             	$color: "#F2F6EC",
             	text: "#333333",
             	$area: 1			
			},
			children:[]
	};
	return node;
}
function makeUnitNode(item){
	var slug = item._about.split("/");
	slug = slug[slug.length-1];
	
	var node = {
			id:slug,
			name:item.label[0].replace("@en",""),
			data: {
				type:"Unit",
				uri:item._about,
				processed:false,
             	//$color: "#819C9B", //teal
             	$color: "#758200",
             	text: "#FFFFFF", 
             	$area: 1							
			},
			children:[]
	};
	return node;
}
function makeDeptNode(item){
	var slug = item._about.split("/");
	slug = slug[slug.length-1];
	
	var node = {
			id:slug,
			name:item.prefLabel.toString().replace("@en",""),
			data: {
				type:"Department",
				uri:item._about,
				processed:false,
             	$color: "#577D00",             	
             	text: "#FFFFFF", 
             	$area: 1	
			},
			children:[]
	};
	return node;
}
function makeGovNode(){

	var node = {
			id:"Government",
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