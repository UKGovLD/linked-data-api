/*

gov-structure.js

Treemap visualisation from the JIT.
http://thejit.org/

Modified by @danpaulsmith for the Government Structure 
visualisation.

2011

*/



$(document).ready(function() {

	$("#infovis").width($(window).width()-140);
	$("#infovis").height($(window).height()-71);
	
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
	
	$( "a.zoomOut").button().click(function() { 
				$("div#nodeTip").hide();
				if(rootNode.data.type == "Department"){
					rootNode = global_govJSON;
				} else {
					rootNode = prevNode;				
				}
				global_TM.out();
				global_TM.refresh();  
				restyle();
				var tempSlug;
				if(rootNode.data.type == "Department"){
					// Department node
					$("h1.title button#post").hide();
					$("h1.title button#unit").hide();
					tempSlug = rootNode.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title button#dept").html(rootNode.name.valueOf()).attr('rel',tempSlug).show();
					$("h1.title button#gov").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
					});					
				} else {
					// Gov node
					$("h1.title button#dept").hide();
					$("h1.title button#unit").hide();
				}	
	});

	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	/*
	$("select#levels").val("1");
	
	$("select#levels").change(function() {
		global_TM.canvas.opt.levelsToShow = parseInt($(this).val());
		global_TM.refresh();
		global_TM.refresh();
		restyle();
	});

	$("input[name='deputies']").val("No");

	$("input[name='deputies']").change(function(){
		if($(this).val() == "Yes") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			includeDeputyDirectors = true;
			init();
    	} else if ($(this).val() == 'No') {
			global_TM.canvas.clear();
			$("#infovis").html("");
			includeDeputyDirectors = false;
			init();
   		}
	});

	$("input[name='resizeBy']").change(function(){
		if($(this).val() == "Unit") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			sizeByUnits = true;
			sizeByPosts = false;
			init();
    	} else if ($(this).val() == "Post") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			sizeByUnits = false;
			sizeByPosts = true;
			init();
   		}
	});	
	*/	
	
	$('div#right').children().css('visibility','visible');
	
	init(param_dept,param_unit);
	
	
});

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
var debug = true;
var global_department="",global_post="",global_TM="",global_deptJSON="",deptParam="",unitParam="";
var includeDeputyDirectors=false, sizeByUnits = true, sizeByPosts = false;
var api_call_info = [];
var rootNode, prevNode;

function init(pDept,pUnit){
	
	deptParam = pDept;
	unitParam = pUnit;
	
	api_call_info = [];
	$('div#apiCalls').hide();
	$("a.source").remove();
	$('div.apiCall').remove();
	
	loadDepts();
	
	var tm = new $jit.TM.Squarified({  
		//where to inject the visualization  
		injectInto: 'infovis',  
		//parent box title heights  
		titleHeight: 0,  
		//enable animations  
		animate: false,  
		//box offsets  
		offset: 0, 
		levelsToShow: 1, 
		//Attach left and right click events   	   
		Events: {  
			enable: true,  
			onClick: function(node) {				
				
				$("h1.title button").css("visibility","visible");
				
				if(node){
					$("div#nodeTip").hide();
					prevNode = rootNode;
					rootNode = node;  				
					var tempSlug;
					if(node.data.type == "Department"){
						//$('h1.title button#gov').button( "option", "disabled", false );
						//$('h1.title button#dept').button( "option", "disabled", true );
						
						tempSlug = node.data.uri.split("/");
						tempSlug = tempSlug[tempSlug.length-1];
						$("h1.title button#dept").button( "option", "label", node.name.valueOf()).attr('rel',tempSlug).show();
						$("h1.title button#gov").show();
						$("h1.title button#unit").hide();
						
						$("h1.title button#gov").unbind('click').bind('click',function(){	
							//$('h1.title button#gov').button( "option", "disabled", true );
							$("h1.title button#gov").hide();
							$("h1.title button#dept").hide();
							$("h1.title button#unit").hide();
							global_TM.out();
							global_TM.refresh();
							restyle();
							rootNode = global_govJSON;					
						});
					} else if(node.data.type == "Unit"){
						//$('h1.title button#dept').button( "option", "disabled", false );
						sizeUnitPosts(node);
						tempSlug = node.data.uri.split("/");
						tempSlug = tempSlug[tempSlug.length-1];
						$("h1.title button#unit").button( "option", "label", node.name.valueOf()).attr('rel',tempSlug).show();
						$("h1.title button#gov").show();
						$("h1.title button#dept").show();
						
						//$('h1.title button#unit').button( "option", "disabled", true );						
						$("h1.title button#gov").unbind('click').bind('click',function(){
							$("h1.title button#dept").hide();
							$("h1.title button#unit").hide();					
							global_TM.out();
							global_TM.out();
							global_TM.refresh();
							restyle();
							rootNode = global_govJSON;
						});
						$("h1.title button#dept").unbind('click').bind('click',function(){
							//$('h1.title button#dept').button( "option", "disabled", true );
							$("h1.title button#unit").hide();										
							global_TM.out();
							global_TM.refresh();
							restyle();
							rootNode = prevNode;
						});
						//hideLog();
					} else {
						// Gov node
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
	                        global_TM.enter(node);                         
	                }
                } else {
                	// not a node
                }
                global_TM.refresh();            
                restyle();
			},
			onRightClick: function() {
				//global_TM.canvas.opt.levelsToShow = 1;
				$("div#nodeTip").hide();
				if(rootNode.data.type == "Department"){
					rootNode = global_govJSON;
				} else {
					rootNode = prevNode;				
				}
				global_TM.out();
				global_TM.refresh();  
				restyle();
				var tempSlug;
				if(rootNode.data.type == "Department"){
					// Department node
					$("h1.title button#post").hide();
					$("h1.title button#unit").hide();
					tempSlug = rootNode.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title button#dept").html(rootNode.name.valueOf()).attr('rel',tempSlug).show();
					$("h1.title button#gov").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
					});					
				} else {
					// Gov node
					$("h1.title button#dept").hide();
					$("h1.title button#unit").hide();
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
				if(node.data.type == "Department"){
					$("div#nodeTip").html('<span class="label">'+node.name.valueOf()+'</span><span class="prop">Posts</span><span class="value">'+(parseInt(node.data.$area)-1)+'</span>').css("top",(e.pageY - 100) + "px").css("left",(e.pageX - 200) + "px").show();
				} else if (node.data.type == "Unit") {
					$("div#nodeTip").html('<span class="label">'+node.name.valueOf()+'</span><span class="prop">Posts</span><span class="value">'+(parseInt(node.data.$area))+'</span>').css("top",(e.pageY - 100) + "px").css("left",(e.pageX - 200) + "px").show();				
				} else if(node.data.type == "Post") {
					$("div#nodeTip").html('<span class="label">'+node.name.valueOf()+'</span><span class="prop">Reports</span><span class="value">'+(parseInt(node.data.$area)-1)+'</span>').css("top",(e.pageY - 100) + "px").css("left",(e.pageX - 200) + "px").show();
				}
			},function(){
				$(domElement).get(0).style.border = '1px solid transparent'; 
				$("div#nodeTip").hide();
			});
		}
	});
	
	global_TM = tm;

} // end init


/*
 *
 */
function loadDepts() {

	showLog("Loading data ...");

	var postList = new Array();
	
	// Description of API call
	api_call_info.push({
		title:"Retrieves a list of all departments",
		description:"Asks for a list of all departments, each of their units, each of the unit's posts and also the posts that report to those posts - used to size them.",
		url:"http://reference.data.gov.uk/doc/department",
		parameters:"?_view=minimal&_properties=unit.label,unit.post.label,unit.post.reportsTo&_pageSize=100"
	});	
	
	//api_call_info[0].url = "http://danpaulsmith.com/puelia3/doc/department.json?_view=minimal&_properties=unit.label,unit.post.label,unit.post.reportsTo&_pageSize=100"
	//alert("using danpaulsmith.com API");
	
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
			var tempUnitNode = {};
			
			// Build department tree first
			// Attach units
		
			// Attach departments to government node using 
			// their number of posts as their size
			var deptSize=1;
			for(var i=0; i<depts.length; i++) {
								
				if(typeof depts[i]._about != 'undefined') {
					tempDeptNode = makeDeptNode(depts[i]);
					if(typeof depts[i].unit != 'undefined') {
						for(var j=0;j<depts[i].unit.length;j++) {
							tempUnitNode = makeUnitNode(depts[i].unit[j]);
							if(typeof depts[i].unit[j].post != 'undefined'){
									tempUnitNode.data.$area = depts[i].unit[j].post.length;
									deptSize += depts[i].unit[j].post.length;
									for(var k=0;k<depts[i].unit[j].post.length;k++){
										tempUnitNode.children.push(makePostNode(depts[i].unit[j].post[k]))
									}
							}
							tempDeptNode.children.push(tempUnitNode);
						}
					}
					if(deptSize > 1){
						tempDeptNode.data.$area = deptSize;
					}
					global_govJSON.children.push(tempDeptNode);
					deptSize = 1;					
				}		
			}
			
			//resizePosts(global_govJSON);
			

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
					var node = global_TM.graph.getNode("dept_"+deptParam);
					$("h1.title button#dept").html(node.name.valueOf()).show();
					$("h1.title button").css("visibility","visible");
					global_TM.enter(node);
					prevNode = global_govJSON;
					rootNode = node;
					$("h1.title button#gov").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
						$("h1.title button#dept").hide();
					});
				}catch(e){
					showLog("Department not found ...");
				}
			} else if(typeof unitParam != 'undefined' && unitParam.length > 1){
				try{
					var uNode = global_TM.graph.getNode("unit_"+unitParam);
					var dNode = global_TM.graph.getNode("dept_"+deptParam);
					$("h1.title button#unit").html(uNode.name.valueOf()).show();			
					$("h1.title button#dept").html(dNode.name.valueOf()).show();
					sizeUnitPosts(uNode);
					$("h1.title button#dept").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
						rootNode = dNode;
						prevNode = global_govJSON;
						$("h1.title button#unit").hide();
					});	
					$("h1.title button#gov").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.out();
						global_TM.refresh();
						restyle();
						$("h1.title button#unit").hide();
						$("h1.title button#dept").hide();
					});							
					$("h1.title button").css("visibility","visible");	
					global_TM.enter(uNode);	
					prevNode = dNode;
					rootNode = uNode;	
				}catch(e){
					showLog("Unit not found ...");
				}
			}

			restyle();
			
			$("#infovis").css("visibility","visible");
									
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
			id:"post_"+slug,
			name:item.label[0].toString(),
			data: {
				type:"Post",
				uri:item._about,
				processed:false,
             	//$color: "#888888", 
             	$color: "#F2F6EC",
             	text: "#333333",
             	$area: 1,
             	reportsTo: item.reportsTo		
			},
			children:[]
	};
		
	return node;
}
function makeUnitNode(item){
	var slug = item._about.split("/");
	slug = slug[slug.length-1];
	
	var node = {
			id:"unit_"+slug,
			name:item.label[0],
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
			id:"dept_"+slug,
			name:"dept"+slug,
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
	
	// Find a name for the Department
	if(typeof item.prefLabel != 'undefined'){
		node.name = item.prefLabel.toString();
	}else if(typeof item.label != 'undefined'){
		node.name = item.label[0].toString();
	}else if(typeof item.altLabel != 'undefined'){
		node.name = item.altLabel[0].toString();
	}
	
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


function resizePosts(jsonObj) {

	if( typeof jsonObj == "object" ) {
	
		$.each(jsonObj, function(k,v) {

			if(typeof k == "number" && v.data != 'undefined' && v.data.type == "Post"){
				
				for(var y=0;y<reportsToArray.length;y++){
					if(v.data.uri == reportsToArray[y].p){
						v.data.$area = reportsToArray[y].r;
						reportsToArray.splice(y,1);
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

function sizeUnitPosts(unitNode) {
	
	var unitNodes = unitNode.getSubnodes();
	var unitNodes2 = unitNode.getSubnodes();
	var reportsToArray = [];
	var counter_R = 0;
	var counter_Q = 0;	
	var loop = true;
	var pSlug;
	
	for(var k=0;k<unitNodes.length;k++) {
	
	if(unitNodes[k].data.type == "Post"){

	var postNode = unitNodes[k];
	counter_R = 0;
	counter_Q = 0;
	//cl(postNode);
	// Loop through the post items in a unit
	if(typeof postNode.data.reportsTo != 'undefined'){

			//cl("------------");
            while(loop) {
            
				//cl(postNode.name);
				//cl(postNode.label)
				//cl(postNode);
				
				
				if(typeof postNode.data != 'undefined' && typeof postNode.data.reportsTo != 'undefined') {
					// A vis node
					/*
					$.each(unitNodes2, function(k,v) {
						
						if(typeof v.data != 'undefined' && v.data.type == "Post"){	
							// Found vis node
							if(postNode.data.uri == v.data.uri) {
								// Match
								postNode.data.$area+=counter_R;
								counter_R++;
							}
						} else if(typeof v.reportsTo != 'undefined'){
							// Found api node
							if(postNode.data.uri == v.reportsTo._about) {
								// Match
								postNode.data.$area+=counter_R;
								counter_R++;
							}						
							
						} 
					});	
					*/			
					postNode=postNode.data.reportsTo[0];
				} else if (typeof postNode.reportsTo != 'undefined') {
					// An API node
					// Find node in vis JSON, increase area by one
					pSlug = postNode._about.split("/");
					pSlug = "post_"+pSlug[pSlug.length-1];
					var node = global_TM.graph.getNode(pSlug);
					node.data.$area++;
					/*
					$.each(unitNodes2, function(k,v) {
						
						if(typeof v.data != 'undefined' && v.data.type == "Post"){	
							// Found vis node
							if(node.data.uri == v.data.uri) {
								// Match
								node.data.$area+=counter_R;
								counter_R++;
							}
						} else if(typeof v.reportsTo != 'undefined'){
							// Found api node
							if(node.data.uri == v.reportsTo._about) {
								// Match
								node.data.$area+=counter_R;
								counter_R++;
							}						
							
						}
						
					});
					*/
					postNode=postNode.reportsTo[0];
					
				} else {
					loop=false;
					break;				
				}
				
				
			}
			
			loop=true;
			counter_R = 0;
			/*
				$.each(unitNodes2, function(k,v) {
					if(typeof v.data != 'undefined' && v.data.type == "Post"){
						// Found vis node
						
						
						if(v.data.uri == postNode.data.uri){
						reportsToArray.push({
							p:post._about,
							r:counter_Q
						});	
						counter_R++;
					// Post has been evaluated	
						} else {
						reportsToArray.push({
							p:post._about,
							r:counter_R
						});	
						counter_R++;
						counter_Q++;
						}
						
					} else if(typeof v.reportsTo != 'undefined'){
						// Found api node
						
						v.reportsTo._about
					}
				});
			*/	
					
		}
																									
		
	} else {
		// Not a post node
	}		

}
	//resizePosts(global_govJSON);
	
	
}



