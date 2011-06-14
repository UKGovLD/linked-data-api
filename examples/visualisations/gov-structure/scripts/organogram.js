/*

organogram.js

Spacetree visualisation from the JIT.
http://thejit.org/

Modified by Dan Paul Smith
@danpaulsmith.

2011

*/

var Orgvis = {
	vars: {
		labelType:"",			// var for theJIT
		useGradients:"",		// var for theJIT
		nativeTextSupport:"",	// var for theJIT
		animate:false,			// var for theJIT
		ST_move:true,			// custom var for use in core JIT code (controls tree moving on click)
		previewMode:false,		// Used to initialise authentication and to swap API locations
		previewParam:false,		// 
		global_department:"",	// The department in questions ID
		global_pubbod:"",		// The public body in questions ID
		global_typeOfOrg:"",	// The type of organisation the post is in (used for URL slugs)
		global_postOrg:"",		// The organisation the post is in regardless of it being a dept/public-body
		global_orgSlug:"",		// The variable name for the post's organisation
		global_post:"",			// The post in question's ID
		global_ST:"",			// Holds theJIT's SpaceTree instance
		global_postJSON:"",		// Holds the organogram data
		colours: [
			'#FFA4A4',			// red
			'#FFC48E',			// orange
			'#A3FEBA',			// lime green
			'#FFFF84',			// yellow
			'#BBEBFF',			// light blue
			'#CAB5FE',			// purple
			'#8FFEDD',			// cyan
			'#E4C6A7',			// brown
			'#FFBBDD',			// pink
			'#E9E9C0',			// faded green
			'#CDCCFF' 			// blue
		],
		jpColourCounter:0,		// Used to colour the junior post nodes
		postList:{},			// An associative array of posts
		unitList:{},			// An associative array of units
		postInQuestion:{		// The node object of the post in question (PIQ)
			name:"post"
		},		
		postInQuestionReportsTo:[],	// An array of node objects the PIQ reports to
		firstNode:{},			// The first node object of the organogram
		firstLoad:true,			// Used for reloading the vis without retrieving the data again
		autoalign:true,			// automatically center the organogram onclick
		canvasPanned:false,		// Controls repositioning when the canvas has been moved
		reOpen:false,			//
		visOffsetX:180,			// horizontal positioning
		visOffsetY:0,			// vertical positioning
		JPcount:0,				// Junior post count
		transX: 0, 				// Canvas translateOffsetX value
		transY: 0,				// Canvas translateOffsetY value
	 	apiBase:"",
	 	apiCallInfo: {},		// Stores information about each API call to be made}
		firstLoad_expectedApiResponses:3, // Used to make the app wait until the correct number of API responses have been gathered
		apiResponses:[],		// Stores JSON responses from the API
		cacheObj:{},			// An object to store API responses
		useJSONP:false,			// Boolean for setting the AJAX dataType
		debug:true				// Output to console or not
	},
	init:function(deptSlug,pubbodSlug,postSlug,reload,pMode){
						
		if(pMode == "clear"){
			$.cookie("organogram-preview-mode", null);
			$.cookie("organogram-username", null);
			$.cookie("organogram-password", null);
		}

		log('$.cookie("organogram-preview-mode"):'+$.cookie("organogram-preview-mode"));
		log("pMode: "+pMode);
			
		if(deptSlug.length > 0){
			Orgvis.vars.global_typeOfOrg = "department";	
			Orgvis.vars.global_orgSlug = "dept";
			Orgvis.vars.global_postOrg = deptSlug;
		} else if(pubbodSlug.length > 0) {
			Orgvis.vars.global_typeOfOrg = "public-body";
			Orgvis.vars.global_orgSlug = "pubbod";
			Orgvis.vars.global_postOrg = pubbodSlug;
		}

		if(postSlug.length < 1){
			//showLog("No post selected!");
			Orgvis.notify("Error","Cannot load organogram, no post selected!", true, "error_noPost");
		} else{
			Orgvis.vars.global_post = postSlug;		
		}
		
			
		// Check for preview parameter
		if(pMode == "true"){
			log("Param: In preview mode");
			// In preview mode

			Orgvis.vars.apiBase = "organogram.data.gov.uk";			
			//Orgvis.vars.apiBase = "192.168.1.74";
			//Orgvis.vars.apiBase = "organogram.data.gov.uk/puelia5";
			//Orgvis.vars.apiBase = "192.168.2.8/puelia5";
			//Orgvis.vars.apiBase = "localhost/puelia5"
			Orgvis.vars.previewParam = true;			

		} else if($.cookie("organogram-preview-mode")) {
			log("Cookie: In preview mode");
			// In preview mode
			Orgvis.vars.previewMode = true;
			$("span#previewModeSign").show();
			Orgvis.vars.apiBase = "organogram.data.gov.uk";
			//Orgvis.vars.apiBase = "organogram.data.gov.uk/puelia5";
			//Orgvis.vars.apiBase = "192.168.2.8/puelia5";
			//Orgvis.vars.apiBase = "localhost/puelia5"
		} else {
			log("Not in preview mode");
			// Not in preview mode
			Orgvis.vars.apiBase = "reference.data.gov.uk";
		}

		if(document.domain == Orgvis.vars.apiBase){
			Orgvis.vars.useJSONP = false;
		}else {
			Orgvis.vars.useJSONP = true;
		}
		
		Orgvis.initSpaceTree(reload);
	
	},
	initSpaceTree:function(reload){
		
		var getTree = (function() {
			var global_postJSON_string = JSON.stringify(Orgvis.vars.global_postJSON);
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
			duration: 200,
			fps:30,
			orientation: 'left',
			offsetX: Orgvis.vars.visOffsetX,  
			offsetY: Orgvis.vars.visOffsetY, 
			transition: $jit.Trans.Quad.easeIn, 
			levelDistance: 40,  
			levelsToShow: 1, 
			Node: {
				height:80,
				width: 177,
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
				// Align nodes vertically
				/*
				$("div#infovis-label").children("div").hide();
				var nodes = $("div#infovis-label").children("div").toArray();
				var len = nodes.length;
				for(var i=len;i--;){
					var h = $(nodes[i]).height();
					if(h > 60){} 
					else if (h > 50){
						$(nodes[i]).css("margin-top","10px");
					} else if (h > 35){
						$(nodes[i]).css("margin-top","15px");
					} else {
						$(nodes[i]).css("margin-top","20px");
					}
				}
				$("div#infovis-label").children("div").show();
				*/
				$("div.node").each(function(){
					var h = $(this).height();
					if(h > 60){
					
					} else if (h > 50){
						$(this).css("margin-top","10px");
					} else if (h > 35){
						$(this).css("margin-top","15px");
					} else {
						$(this).css("margin-top","20px");
					}		
				});	
					
					
			},  
			onCreateLabel: function(label, node){
				
				// If the clicked node is a node and not a junior post
				if(typeof node.data != 'undefined' && node.data.type != 'junior_posts') {
				
					// Change the opacity if the node is not fully loaded
					
					//log("onCreateLabel: node.data.childrenAdded: "+node.data.childrenAdded);
					/*if(node.data.childrenAdded){
						$(label).css({ opacity: 1 });
					} else {
						$(label).css({ opacity: 0.7 });
					}*/

					label.id = node.id;        
					label.innerHTML = node.name;
					
					if(typeof node.data.grade != 'undefined'){
						$(label).addClass(node.data.grade);
					}
					
					if(node.data.heldBy.length > 1){
						for(var i=node.data.heldBy.length;i--;){
							$(label).addClass("post_"+Orgvis.getSlug(node.data.heldBy[i].holdsPostURI));
						}
					} else {
						$(label).addClass("post_"+Orgvis.getSlug(node.data.uri));
					}

					if(typeof node.data.postIn != 'undefined' && node.data.postIn.length > 0){
						var pi=node.data.postIn;			
						for(var a=pi.length;a--;){
							if(pi[a]._about.indexOf("/unit/") > 0 && label.innerHTML.indexOf('childLoader') < 0){
								label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">'+pi[a].label[0]+'</span><span class="childLoader"><img src="../images/childLoader.gif" /></span>';
							} else {}
						}
					} else {
						label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">?</span>';
					}
					
					if(node.data.heldBy.length>1){
						label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.totalWorkingTime+'</span>';
					}

				// If the node is associated with junior posts					
				} else if(node.data.type == 'junior_posts'){
				
					$(label).addClass('juniorPost');
					$(label).addClass(node.data.nodeType);
											
					label.innerHTML = node.name;					
					
					switch (node.data.nodeType) {
					
						case 'jp_child' : 
							// Node is a Junior Post					
							var fteTotal = Math.round(node.data.fullTimeEquivalent*100)/100;
							label.innerHTML = label.innerHTML + '<span class="jp_grade">'+node.data.salaryRange+'</span><span class="heldBy">'+fteTotal+'</span>';	
							break;
						
						case 'jp_group' :
							// Node is a Junior Post Group
							var fteTotal = Math.round(node.data.fteTotal*100)/100;
							label.innerHTML = label.innerHTML + '<span class="jp_grade">'+node.data.property+'</span>' + '<span class="heldBy">'+fteTotal+'</span>';						
							break;
						
						case 'jp_parent' :
							// Node is a Junior Post parent
							label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.fteTotal+'</span>';
							label.innerHTML += 
								'<div class="jp_group_selector"><ul>' + 
								'<li class="profession">Profession</li>' + 
								'<li class="unit">Unit</li>' + 
								'<li class="grade">Grade</li>' + 
								'<li class="ungroup selected">Ungrouped</li>' + 
								'</ul></div>';						
							break;
					}
						
					//log(node.data.colour);
					$(label).css('color',node.data.colour);	
				} else {
					//log("clicked something, but not sure what!");
				}
				
				label.onclick = function(){ 										

						var m = {
						    offsetX: st.canvas.translateOffsetX+Orgvis.vars.visOffsetX,
						    offsetY: st.canvas.translateOffsetY,
						    enable: Orgvis.vars.autoalign
						};
						
						//log("label.onclick - ");
						//log("X: "+Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetX);
						//log("Y: "+Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetY);

						if(Orgvis.vars.transX != Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetX || Orgvis.vars.transY != Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetY){
							log("Panning has occurred");
							Orgvis.vars.canvasPanned = true;
							m.offsetX -= Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetX;
							m.offsetY -= Orgvis.vars.global_ST.canvas.canvases[0].translateOffsetY;	
						} else {
							//log("Panning has not occurred");
						}
														
						switch(node.data.type) {
							
							default :
								// A post has been clicked
								// log('a post node has been clicked');	
								$("div.jp_group_selector").hide();		
								
								$("div.node").removeClass("selected");
								$("div#"+node.id).addClass("selected");
																
								$("#infobox").hide(0,function(){
									Orgvis.loadPostInfobox(node);
								});
																
								//log("### clicked, node.name="+node.name);
								//log("### clicked, node.data.childrenAdded="+node.data.childrenAdded);
								//log("### clicked, Orgvis.vars.postList[postID].data.childrenAdded="+Orgvis.vars.postList[postID].data.childrenAdded);

								//log(node.data.gettingStats);
								//log(node.data.gotStats);
								if(!node.data.gotStats && !node.data.gettingStats){
									node.data.gettingStats = true;
									Orgvis.getStatisticsData(node);
								}								
						
								var postID = Orgvis.getSlug(node.data.uri);	
								
								// On-demand handling
								if(postID != Orgvis.vars.global_post && !node.data.childrenAdded && !node.data.onDemandInAction){
									node.data.onDemandInAction = true;
									$("div#"+node.id+" span.childLoader").show();
									Orgvis.getPostReportsOnDemand(node);
									Orgvis.getJuniorStaffOnDemand(node);									
								}					
								
								st.onClick(node.id, { 
									Move: m
								});		
								
								if(Orgvis.vars.canvasPanned){
									Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());
									Orgvis.vars.canvasPanned = false;
								}
																									
								break;
							
							case 'junior_posts' :
								
								//log('clicked junior_posts node');
								
								switch(node.data.nodeType){
									
									default : 
										//log('clicked junior_posts:default');
										$("#infobox").hide();
										$("div.jp_group_selector").hide();
										$("div.node").removeClass("selected");
										$("div#"+node.id).addClass("selected");
										st.onClick(node.id, { 
											Move: m
										});	
										if(Orgvis.vars.canvasPanned){
											Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());
											Orgvis.vars.canvasPanned = false;
										}
										break;
										
									case 'jp_parent' :
										
										// A "JUNIOR POSTS" node has been clicked
										
										//log('clicked junior_posts:jp_parent');
										
										$("#infobox").hide();
										
										$("div#"+node.id+" div.jp_group_selector").slideDown();
										$("div.node").removeClass("selected");
										$("div#"+node.id).addClass("selected");
														
										$("div#"+node.id+" div.jp_group_selector ul li").unbind('click');
										$("div#"+node.id+" div.jp_group_selector ul li").bind('click',function(event){

											//log("jp_parent clicked, class="+$(this).attr("class"));
											$("div#"+node.id+" div.jp_group_selector ul li").removeClass("selected");
											
											switch($(this).html()) {
											
												case "Profession":
												
													$(this).addClass("selected");
													var tree = {
														id:node.id,
														name:node.name,
														data:node.data,
														children:node.data.byProfession
													};
													
													Orgvis.vars.global_ST.removeSubtree(node.id, false, 'replot', {  
								                        hideLabels: false,  
								                        onComplete: function() {}
								                     });										
				
						                        	Orgvis.vars.global_ST.addSubtree(tree, 'replot', {  
						                        		hideLabels: false,  
							        					onAfterCompute: function() {}
						                        	});	
						                        	break;
						                        												
												case "Unit":
												
													$(this).addClass("selected");
													var tree = {
														id:node.id,
														name:node.name,
														data:node.data,
														children:node.data.byUnit
													};
													
													Orgvis.vars.global_ST.removeSubtree(node.id, false, 'replot', {  
								                        hideLabels: false,  
								                        onComplete: function() {}
								                     });										
				
						                        	Orgvis.vars.global_ST.addSubtree(tree, 'replot', {  
						                        		hideLabels: false,  
							        					onAfterCompute: function() {}
						                        	});
													break;
													
												case "Grade":

													$(this).addClass("selected");

													var tree = {
														id:node.id,
														name:node.name,
														data:node.data,
														children:node.data.byGrade
													};
				
													Orgvis.vars.global_ST.removeSubtree(node.id, false, 'replot', {  
								                        hideLabels: false,  
								                        onComplete: function() {}
								                     });										
				
						                        	Orgvis.vars.global_ST.addSubtree(tree, 'replot', {  
						                        		hideLabels: false,  
							        					onAfterCompute: function() {}
						                        	});
													break;
													
												case "Ungrouped":
													
													$(this).addClass("selected");
													
													var tree = {
														id:node.id,
														name:node.name,
														data:node.data,
														children:node.data.unGrouped
													};
													
													Orgvis.vars.global_ST.removeSubtree(node.id, false, 'replot', {  
								                        hideLabels: false,  
								                        onComplete: function() {}
								                     });										
				
						                        	Orgvis.vars.global_ST.addSubtree(tree, 'replot', {  
						                        		hideLabels: false,  
							        					onAfterCompute: function() {}
						                        	});
													break;
													
												default:
												
											}
										
										}); // end bind click
																				
										st.onClick(node.id, { 
											Move: m
										});	
										
										if(Orgvis.vars.canvasPanned){
											Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());
											Orgvis.vars.canvasPanned = false;
										}
										break;
									
									case 'jp_group' :
									
										// A junior post group has been clicked
										//log('clicked junior_posts:jp_group');
										$("#infobox").hide();
										$("div.jp_group_selector").hide();
										$("div.node").removeClass("selected");
										$("div#"+node.id).addClass("selected");										
										st.onClick(node.id, { 
											Move: m
										});
										if(Orgvis.vars.canvasPanned){
											Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());
											Orgvis.vars.canvasPanned = false;
										}
										break;
											
									case 'jp_child' :

										// A junior post has been clicked									
										//log('clicked junior_posts:jp_child');
										
										$("div.jp_group_selector").hide();
										$("div.node").removeClass("selected");
										$("div#"+node.id).addClass("selected");
										$("#infobox").hide(0,function(){
											Orgvis.loadJuniorPostInfoBox(node);	
										});							
										st.onClick(node.id, { 
											Move: m
										});
										if(Orgvis.vars.canvasPanned){
											Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());
											Orgvis.vars.canvasPanned = false;
										}
										break;
									
									case 'jp_none' :
										//log('clicked junior_posts:jp_none');
										$("#infobox").hide();
										$("div.jp_group_selector").hide();
										break;
								}
								
								break;
						}		
						
				};  // end label.onClick
				
				var style = label.style;
				style.width = 170 + 'px';
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
		
		Orgvis.vars.global_ST = st;
		
		if(Orgvis.vars.previewMode){
			//Orgvis.notify("Loading","Calling API...",true,"loading_data");	
			//log(Orgvis.vars.apiCallInfo);
			//log(Orgvis.vars.apiResponses);
			Orgvis.getRootPostData();
			Orgvis.getPostReportsData();
			Orgvis.getJuniorStaffData();			
		} else if(!reload){	
			//Orgvis.notify("Loading","Calling API...",true,"loading_data");				
			Orgvis.getRootPostData();
			Orgvis.getPostReportsData();
			Orgvis.getJuniorStaffData();
		} else {
			Orgvis.notify("Loading","Reloading organogram data...",true,"loading_reloading");					
			Orgvis.reloadPost();
		}
	},
	getRootPostData:function() {

		Orgvis.vars.apiCallInfo.rootPost = {
			title:"Retrieval of root post information",
			description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
			url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post,
			parameters:""
		};
		
		var s = {	
			url: Orgvis.vars.apiCallInfo.rootPost.url+".json"+"?"+Orgvis.vars.apiCallInfo.rootPost.parameters+"&callback=?",
			error:function (){
				log("API - rootPost - error");
				$.cookie("organogram-preview-mode", null);
				//if(Orgvis.vars.previewMode){	
				//	Orgvis.showLogin();					
				//}
				//Orgvis.changeLog("Error loading post's data", false);
				$("div#loading_post").trigger("jGrowl.close").remove(); 
				Orgvis.notify("Error","Could not retrieve the main post's data",true,"error_post");
			},
			success: function(json){
				
				$("div#" + "loading_post").trigger("jGrowl.close").remove();

				if(Orgvis.vars.previewParam){
					$("span#previewModeSign").show();
					$.cookie("organogram-preview-mode", true);
					Orgvis.vars.previewMode = true;
				}
				
				if(typeof json.result.primaryTopic.label != 'undefined'){
					Orgvis.notify("Success","Loaded data for \""+json.result.primaryTopic.label[0]+"\"",false,"success_post");
					// Display the breadcrumbs at the top of the vis
					Orgvis.loadRootPost(json);
					// Pass data to the regData function
					Orgvis.regData(json);
				} else {
					//Orgvis.changeLog("Could not retrieve the main post's data",false);
					Orgvis.notify("Error","Could not retrieve the main post's data",true,"error_post");
				}					
			}
		};

		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}
		
		Orgvis.notify("Loading","Post data",true,"loading_post");		
		$.myJSONP(s,"data",{name:"post"});
	},
	getPostReportsData:function() {
		
		log("getting reports full data");

		var pageSize = 20;
		var combinedJSON = {};
		var pageNumber = 1;
				
		Orgvis.vars.apiCallInfo.postReports = {
				title:"Retrieval of posts that report to the root post",
				description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post+"/reports-full",
				parameters:"?_pageSize="+pageSize
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.postReports.url+".json"+Orgvis.vars.apiCallInfo.postReports.parameters+"&callback=?",			
				error: function(){
					log("API - postReports - error");
					//Orgvis.changeLog("Error loading post's organogram data", false);
					if(pageNumber > 1) {
						$("div#loading_reportingPosts_"+pageNumber).trigger("jGrowl.close").remove(); 	
					} else {
						$("div#loading_reportingPosts").trigger("jGrowl.close").remove(); 	
					}					
					Orgvis.notify("Error","Could not load reporting posts", true, "error_reportingPosts");
				},
				success: function(json){
											
					// Store results
					if(typeof combinedJSON.result == 'undefined'){
						combinedJSON = json;
					} else {
						combinedJSON.result.items = combinedJSON.result.items.concat(json.result.items);
					}
									
					// Grab more pages	
					if(typeof json.result.next != 'undefined'){
						
						//log("Reporting posts ("+pageNumber+") - more pages...");
						//log(this);
						pageNumber++;
						s.url = s.url+"&_page="+pageNumber;
						s.url = s.url.replace("&_page="+(pageNumber-1),"");
	
						$("div#" + "loading_reportingPosts").trigger("jGrowl.close").remove();				
						$("div#loading_reportingPosts").trigger("jGrowl.close").remove();
						
						if(pageNumber > 1){
							Orgvis.notify("Success","Loaded reporting posts ("+(pageNumber-1)+")",false,"success_reportingPosts_"+(pageNumber-1));
						} else {
							Orgvis.notify("Success","Loaded reporting posts",false,"success_reportingPosts");
						}
						
						Orgvis.notify("Loading","Post's reporting posts ("+pageNumber+")",true,"loading_reportingPosts_"+pageNumber);	
						$.myJSONP(s,"reporting posts' data",Orgvis.vars.postInQuestion);
				
					} else if(pageNumber > 1) {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#loading_reportingPosts_"+pageNumber).trigger("jGrowl.close").remove();					
						Orgvis.notify("Success","Loaded reporting posts ("+(pageNumber)+")",false,"success_reportingPosts_"+(pageNumber-1));
						Orgvis.regData(combinedJSON);
					} else {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#" + "loading_reportingPosts").trigger("jGrowl.close").remove();				
						Orgvis.notify("Success","Loaded reporting posts",false,"success_reportingPosts");
						$("div#loading_reportingPosts").trigger("jGrowl.close").remove();					
						Orgvis.regData(combinedJSON);
					}	
				}
			};
		
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			s.url = s.url.replace("reportsFull","reports-full");
		}
		
		Orgvis.notify("Loading","Post's reporting posts", true, "loading_reportingPosts");					
		$.myJSONP(s,"reporting posts",Orgvis.vars.postInQuestion);
				
			
	},
	getJuniorStaffData:function() {
		
		//log("getting junior reports data");
		
		var pageSize = 20;
		var combinedJSON = {};
		var pageNumber = 1;
		
		Orgvis.vars.apiCallInfo.juniorStaff = {
				title:"Retrieval of junior staff who report to the root post",
				description:"This call retrieves information about the junior staff that report to the posts within this organogram, such as their grade, title and profession.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post+"/immediate-junior-staff",
				parameters:"?_pageSize="+pageSize
		};		

		var s = {
			url: Orgvis.vars.apiCallInfo.juniorStaff.url+".json"+Orgvis.vars.apiCallInfo.juniorStaff.parameters+"&callback=?",
		    error:function (){
		    	log("API - junior staff - error");
				if(pageNumber > 1) {
					$("div#loading_juniorStaff_"+pageNumber).trigger("jGrowl.close").remove();
				} else {
					$("div#loading_juniorStaff").trigger("jGrowl.close").remove();
				}
				Orgvis.notify("Error","Could not load junior staff",true,"error_juniorStaff");
			},
			success: function(json){
				
				//log("Junior staff success function, "+pageNumber);
				// Store results
				if(typeof combinedJSON.result == 'undefined'){
					combinedJSON = json;
				} else {
					combinedJSON.result.items = combinedJSON.result.items.concat(json.result.items);
				}
								
				// Grab more pages	
				if(typeof json.result.next != 'undefined'){
					
					//log("Junior staff ("+pageNumber+") - more pages...");
					pageNumber++;
					s.url = s.url+"&_page="+pageNumber;
					s.url = s.url.replace("&_page="+(pageNumber-1),"");

					//$("div#" + "loading_juniorStaff").trigger("jGrowl.close").remove();				
					$("div#loading_juniorStaff").trigger("jGrowl.close").remove();
					if(pageNumber > 1){
						Orgvis.notify("Success","Loaded junior staff ("+(pageNumber-1)+")",false,"success_juniorStaff_"+(pageNumber-1));
					} else {
						Orgvis.notify("Success","Loaded junior staff",false,"success_juniorStaff");
					}
					Orgvis.notify("Loading","Post's junior staff ("+pageNumber+")",true,"loading_juniorStaff_"+pageNumber);	
					$.myJSONP(s,"junior staff",Orgvis.vars.postInQuestion);	
			
				} else if(pageNumber > 1) {
					// Pass data to the regData function
					//log("no more pages, passing data to regData");
					log(combinedJSON);
					//$("div#" + "loading_juniorStaff").trigger("jGrowl.close").remove();				
					$("div#loading_juniorStaff_"+pageNumber).trigger("jGrowl.close").remove();					
					Orgvis.notify("Success","Loaded junior staff ("+(pageNumber)+")",false,"success_juniorStaff_"+(pageNumber-1));
					Orgvis.regData(combinedJSON);
				} else {
					// Pass data to the regData function
					//log("no more pages, passing data to regData");
					//$("div#" + "loading_juniorStaff").trigger("jGrowl.close").remove();				
					$("div#loading_juniorStaff").trigger("jGrowl.close").remove();					
					Orgvis.notify("Success","Loaded junior staff",false,"success_juniorStaff");
					Orgvis.regData(combinedJSON);
				}			
			}
		};
			
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}	
	
		Orgvis.notify("Loading","Post's junior staff",true,"loading_juniorStaff");	
		$.myJSONP(s,"junior staff",Orgvis.vars.postInQuestion);		
			
	},
	getStatisticsData:function(node){

	
		var postID = Orgvis.getSlug(node.data.uri);

		// Collated for the API call info box
		Orgvis.vars.apiCallInfo.postStats = {
				title:"Retrieval of a post's statistics data",
				description:"An API call to retrieve the statistical data present for an individual post such as the combined salaries of their junior staff.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+postID+"/statistics",
				parameters:"?_pageSize=20"
		};	
				
		var s = {
			url: Orgvis.vars.apiCallInfo.postStats.url+".json"+Orgvis.vars.apiCallInfo.postStats.parameters+"&callback=?",
		    error:function (){
		    	log("API - stats data: "+node.name+" - error");
				$("div#" + "loading_stats_"+postID).trigger("jGrowl.close").remove();
				Orgvis.notify("Error","Could not load statistics data for \""+node.name+"\"", true,"error_stats_"+postID);
			},
			success: function(json){
				$("div#" + "loading_stats_"+postID).trigger("jGrowl.close").remove();
				Orgvis.notify("Success","Loaded statistics data for \""+node.name+"\"", false,"success_stats_"+postID);
				
				node.data.stats = {
					salaryCostOfReports:{
						value:json.result.items[0].salaryCostOfReports
					},
					date:{
						value:json.result.items[0].date
					}
				};	
				node.data.stats.date.formatted = '['+Orgvis.getSlug(node.data.stats.date.value)+']';
	            
	            if(typeof node.data.stats.salaryCostOfReports.value != 'undefined') {
	            	node.data.stats.salaryCostOfReports.formatted = '£'+addCommas(node.data.stats.salaryCostOfReports.value);
	            } else {
	            	node.data.stats.salaryCostOfReports.value = 'N/A';
	            	node.data.stats.salaryCostOfReports.formatted = 'N/A';
	            }
	            
	            if($("#infobox p.id span.value").html() == postID) {
					$('p.salaryReports').html('<span>Combined salary of reporting posts</span><span class="value">'+node.data.stats.salaryCostOfReports.formatted+'</span><a class="data" target="_blank" href="'+Orgvis.vars.apiCallInfo.postStats.url+'" value="'+node.data.stats.salaryCostOfReports.value+'">Data</a><span class="date">'+node.data.stats.date.formatted+'</span>');	                
	            }
	            
	            node.data.gotStats = true;           

				Orgvis.displayDataSources();
		
			}
		};
			
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}
	
		Orgvis.notify("Loading","Statistics data for \""+node.name+"\"", true,"loading_stats_"+postID);
		$.myJSONP(s,'statistics data for "'+node.name+'"');		
		
	},
	getPostReportsOnDemand:function(node) {
		
		//log("getPostReportsOnDemand");
		
		var postID = Orgvis.getSlug(node.data.uri);
		var pageSize = 20;
		var combinedJSON = {};
		var pageNumber = 1;
									
		Orgvis.vars.apiCallInfo.postReportsOnDemand = {
				title:"Retrieval of posts that report to the clicked post",
				description:"This call retrieves information about the posts that report to the post that has been clicked within the organogram.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+postID+"/immediate-reports",
				parameters:"?_pageSize="+pageSize
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.postReportsOnDemand.url+".json"+Orgvis.vars.apiCallInfo.postReportsOnDemand.parameters+"&callback=?",
				error: function(){
					log("API - postReportsOnDemand - error");
					//Orgvis.changeLog("Error loading clicked post's reporting posts data", false);
					
					if(pageNumber > 1) {
						$("div#loading_rp_onDemand_" + postID+"_"+pageNumber).trigger("jGrowl.close").remove();
					} else {
						$("div#loading_rp_onDemand_" + postID).trigger("jGrowl.close").remove();
					}					
						
					Orgvis.notify("Error","Could not load children posts for "+node.name, true,"error_rp_onDemand_"+postID);					
					// Stops another API call being made
					node.data.childrenAdded = true;
				    $("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
				},
				success: function(json){
					
					// Store results
					if(typeof combinedJSON.result == 'undefined'){
						combinedJSON = json;
					} else {
						combinedJSON.result.items = combinedJSON.result.items.concat(json.result.items);
					}
									
					// Grab more pages	
					if(typeof json.result.next != 'undefined'){
						
						//log("Reporting posts on demand ("+pageNumber+") - more pages...");
						//log(this);
						pageNumber++;
						s.url = s.url+"&_page="+pageNumber;
						s.url = s.url.replace("&_page="+(pageNumber-1),"");
						
						$("div#" + "loading_rp_onDemand_"+postID).trigger("jGrowl.close").remove();				
						
						if(pageNumber > 1){
							Orgvis.notify("Success","Loaded reporting posts for "+node.name+" ("+(pageNumber-1)+")",false,"success_rp_onDemand_"+postID+"_"+(pageNumber-1));
						} else {
							Orgvis.notify("Success","Loaded reporting posts for "+node.name,false,"success_rp_onDemand_"+postID);
						}

						Orgvis.notify("Loading","Reporting posts for "+node.name+" ("+pageNumber+")",true,"loading_rp_onDemand_"+postID+"_"+pageNumber);
						$.myJSONP(s,"reporting posts data",Orgvis.vars.postInQuestion);
				
					} else if(pageNumber > 1) {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#loading_rp_onDemand_"+postID+"_"+pageNumber).trigger("jGrowl.close").remove();					
						Orgvis.notify("Success","Loaded reporting posts for "+node.name+" ("+(pageNumber)+")",false,"success_rp_onDemand_"+postID+"_"+(pageNumber-1));
						Orgvis.addOnDemandNodes(combinedJSON,node);
					} else {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#loading_rp_onDemand_"+postID).trigger("jGrowl.close").remove();							
					    Orgvis.notify("Success","Loaded reporting posts for "+node.name,false,"success_rp_onDemand_"+postID);
						Orgvis.addOnDemandNodes(combinedJSON,node);					
					}					    
				    
				    
				} 
			};	
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			//s.url = s.url.replace("reportsFull","reports-full");
		}

		Orgvis.notify("Loading","Reporting posts for "+node.name+"...",true,"loading_rp_onDemand_"+postID);
		$.myJSONP(s,"reporting posts on demand",node);
				
	},
	getJuniorStaffOnDemand:function(node) {
		
		//log("getJuniorStaffOnDemand");
		
		var postID = Orgvis.getSlug(node.data.uri);
		var pageSize = 20;
		var combinedJSON = {};
		var pageNumber = 1;
		var originalChildren = Orgvis.vars.postList[postID].children.length;
		//log("originalChildren: "+originalChildren);
								
		Orgvis.vars.apiCallInfo.juniorStaffOnDemand = {
				title:"Retrieval of junior staff that report to the clicked post",
				description:"This call retrieves information about the posts that report to the post that has been clicked within the organogram.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+postID+"/immediate-junior-staff",
				parameters:"?_pageSize="+pageSize
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.juniorStaffOnDemand.url+".json"+Orgvis.vars.apiCallInfo.juniorStaffOnDemand.parameters+"&callback=?",
				error: function(){
					log("API - juniorStaffOnDemand - error");
					//Orgvis.changeLog("Error loading clicked post's junior staff data", false);

					if(pageNumber > 1) {
						$("div#loading_jp_onDemand_" + postID + "_"+pageNumber).trigger("jGrowl.close").remove();
					} else {
						$("div#loading_jp_onDemand_" + postID).trigger("jGrowl.close").remove();
					}
					
					Orgvis.notify("Error","Could not load junior staff for "+node.name, true,"error_jp_onDemand_"+postID);					

					// Stops another API call being made
					node.data.juniorStaffAdded = true;
				    $("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
				},
				success: function(json){

					// Store results
					if(typeof combinedJSON.result == 'undefined'){
						combinedJSON = json;
					} else {
						combinedJSON.result.items = combinedJSON.result.items.concat(json.result.items);
					}
									
					// Grab more pages	
					if(typeof json.result.next != 'undefined'){
						
						//log("Junior staff on demand ("+pageNumber+") - more pages...");
						//log(this);
						pageNumber++;
						s.url = s.url+"&_page="+pageNumber;
						s.url = s.url.replace("&_page="+(pageNumber-1),"");
						
						$("div#" + "loading_jp_onDemand_"+postID).trigger("jGrowl.close").remove();				
						if(pageNumber > 1){
							Orgvis.notify("Success","Loaded junior staff for "+node.name+" ("+(pageNumber-1)+")",false,"success_jp_onDemand_"+postID+"_"+(pageNumber-1));
						} else {
							Orgvis.notify("Success","Loaded junior staff for "+node.name,false,"success_jp_onDemand_"+postID);
						}

						Orgvis.notify("Loading","Junior staff for "+node.name+" ("+pageNumber+")",true,"loading_jp_onDemand_"+postID+"_"+pageNumber);
						$.myJSONP(s,"junior staff data",Orgvis.vars.postInQuestion);
				
					} else if(pageNumber > 1) {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#loading_jp_onDemand_"+postID+"_"+pageNumber).trigger("jGrowl.close").remove();					
						Orgvis.addOnDemandNodes(combinedJSON,node);
					    Orgvis.notify("Success","Loaded junior staff for "+node.name+" ("+(pageNumber)+")",false,"success_jp_onDemand_"+postID+"_"+(pageNumber));
					} else {
						// Pass data to the regData function
						//log("no more pages, passing data to regData");
						//log(combinedJSON);
						$("div#loading_jp_onDemand_"+postID).trigger("jGrowl.close").remove();							
						Orgvis.addOnDemandNodes(combinedJSON,node);
					    Orgvis.notify("Success","Loaded junior staff for "+node.name,false,"success_jp_onDemand_"+postID);
					}									
				}
			};		
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}

		Orgvis.notify("Loading","Junior staff for "+node.name+"...",true,"loading_jp_onDemand_"+postID);		
		$.myJSONP(s,"junior staff on demand",node);
			
	},
	addOnDemandNodes:function(json,node){

		var postID = json.result._about.split("post/");
		postID = postID[1].split("/");
		postID = postID[0];
		//log("addOnDemandNodes, postID: "+postID);

		var originalChildren = Orgvis.vars.postList[postID].children.length;
		//log("originalChildren: "+originalChildren);
				
		if(typeof Orgvis.vars.apiResponses["onDemand_"+postID] == 'undefined'){
			// First on-demand call recieved out of two
			if(json.result._about.indexOf("junior-staff") > 0) {
				// junior staff data receieved
				Orgvis.vars.apiResponses["onDemand_"+postID] = {
					juniorStaffOnDemand:json,
					postReportsOnDemand:{}
				};
			} else {
				// reportsTo data received
				Orgvis.vars.apiResponses["onDemand_"+postID] = {
					postReportsOnDemand:json,
					juniorStaffOnDemand:{}
				};				
			}			
		} else {
			// Both on-demand calls received
			//log("Both on-demand calls received");

			$("div#loading_onDemand_" + postID).trigger("jGrowl.close").remove();
			
			if(json.result._about.indexOf("junior-staff") > 0) {
				// junior staff data receieved
				Orgvis.vars.apiResponses["onDemand_"+postID].juniorStaffOnDemand = json;
			} else {
				// reportsTo data received
				Orgvis.vars.apiResponses["onDemand_"+postID].postReportsOnDemand = json;		
			}
		
			
			/* Build the reporting posts JSON structure
			 * and connect to the clicked post by setting the JSON
			 * structure's root post as the clicked post
			 */
			var options = {
				//childrenAdded:true
			};
			
			/* Connect the children posts returned by the API to
			 * the original postList, with the childrenAdded flag
			 * set to true, to prevent onDemand loading for those
			 * nodes.
			*/
			Orgvis.buildPostList(Orgvis.vars.apiResponses["onDemand_"+postID].postReportsOnDemand,options);
	
			/* Assign the newly generated postList (which contains
			 * the root post that connects all other posts) as the
			 * global_postJSON variable, so the data appears in the visualisation.
			 */
			Orgvis.vars.global_postJSON = Orgvis.connectPosts();
										
			/* Connect the junior posts returned by the API to 
			 * the postList.
			*/						
			Orgvis.connectJuniorPosts(Orgvis.vars.apiResponses["onDemand_"+postID].juniorStaffOnDemand);
			
			/* Set the childrenAdded flags and add the "No Junior 
			 * posts" node to the new children nodes.
			 */
			Orgvis.setChildrenAdded(Orgvis.vars.postList[postID]);
			
			log("adding onDemand subtree for "+postID);
			
			Orgvis.onDemandAddNodes(node,postID,originalChildren);
	
		}
		
		return false;

	},
	onDemandAddNodes:function(node,postID,originalChildren){

		//log("onDemandAddNodes()");
		
		if(!Orgvis.vars.addSubtreeBusy){
			
			Orgvis.vars.addSubtreeBusy = true;
			
			Orgvis.vars.global_ST.addSubtree(Orgvis.vars.postList[postID], 'animate', {  
		        hideLabels: false,  
		        onAfterCompute: function(){
		        	Orgvis.onDemandAfterCompute(node,postID,originalChildren);
		        }
		    });		
	
	    	setTimeout(function(){
	    		if(node.data.onDemandInAction){
	    			Orgvis.onDemandAfterCompute(node,postID,originalChildren);
	    		}
	    		Orgvis.vars.addSubtreeBusy = false;
	    	},1000);
	    	
	    		
        
        } else {
        	setTimeout(function(){
        		Orgvis.onDemandAddNodes(node,postID,originalChildren);
        	},500);
        }
        
		return false;
	},
	onDemandAfterCompute:function(node,postID,originalChildren){
		
		//log("onDemandAfterCompute():");
		//log(node.name+"'s originalChildren: "+originalChildren);
		//log(node.name+"'s newChildren: "+Orgvis.vars.postList[postID].children.length);
		
	    if(Orgvis.vars.postList[postID].children.length > originalChildren) {
	    	log("children added");
	    	$("div#"+node.id).css("background-color","#96FFA3").animate({ backgroundColor: "#FFFFFF" }, 5000);
	    	$("div#"+node.id+" span.childLoader").hide();					       
	    } else {
	    	log("no children added");
	    	$("div#"+node.id).css("background-color","#FF9696").animate({ backgroundColor: "#FFFFFF" }, 5000);
	   		$("div#"+node.id+" span.childLoader").hide();
	    }
	    
	    Orgvis.vars.global_ST.refresh();
	    $("div#"+node.id).addClass("loaded");
	    
	    node.data.childrenAdded = true; 
	    node.data.onDemandInAction = false;

	    //Orgvis.getStatsData();
	    
	    Orgvis.updateFilter();
	    
	    return false;
		        	
	},
	regData:function(data) {
		
		//log("registering data");
		
		Orgvis.vars.apiResponses.push(data);
		//log("Orgvis.vars.apiResponses:");
		//log(Orgvis.vars.apiResponses);
		// If both API calls have been made then load the organogram
		if(Orgvis.vars.apiResponses.length == Orgvis.vars.firstLoad_expectedApiResponses){
		log("length is "+Orgvis.vars.firstLoad_expectedApiResponses);
			for(var i=Orgvis.vars.apiResponses.length;i--;){
				if(Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full") > 0){
					log("found reports-full data");
					//if(Orgvis.vars.apiResponses[i].result.items.length > 0){
						Orgvis.loadOrganogram(Orgvis.vars.apiResponses[i]);
					//} else {
					//	Orgvis.notify("Error","No reporting posts could be found.",true,"no_reporting_posts");
					//}
				}
			}
		} else {
			return;
		}
	},	
	loadRootPost:function(json){
	
		//log("loading root post");
		
		var postTree;	
	
		$("#infovis-label").html("");
		$("#infobox").hide();
		
		if(typeof json.result.primaryTopic._about != 'undefined' && typeof json.result.primaryTopic.postIn != 'undefined' && typeof json.result.primaryTopic._about != 'undefined') {
			
			Orgvis.vars.postInQuestion = json.result.primaryTopic;
			//console.log("Post In Question:");
			//console.log(Orgvis.vars.postInQuestion);
			//Orgvis.vars.firstNode = makeNode(json.result.primaryTopic);
	
			// Extract information for visualisation breadcrumbs
			$("h1.title button#post").html(json.result.primaryTopic.label[0]);
			
			var uSlug,dSlug;	
				
			for(var a=json.result.primaryTopic.postIn.length;a--;){
				if(json.result.primaryTopic.postIn[a]._about.indexOf("/unit/") > 0){
					$("h1.title button#unit").html(json.result.primaryTopic.postIn[a].label[0]);
					uSlug = Orgvis.getSlug(json.result.primaryTopic.postIn[a]._about);
				} else {
					$("h1.title button#dept").html(json.result.primaryTopic.postIn[a].label[0]);
					dSlug = Orgvis.getSlug(json.result.primaryTopic.postIn[a]._about);		
				}
			}
			
			//$("h1.title button#unit").attr("rel","../gov-structure?dept="+dSlug+"&unit="+uSlug);
			//$("h1.title button#dept").attr("rel","../gov-structure?dept="+dSlug);
		
			$("h1.title button").css("visibility","visible");
			$("h1.title button#dept").animate({opacity:'1'},1000,function(){
				$("h1.title button#unit").animate({opacity:'1'},1000,function(){
					$("h1.title button#post").animate({opacity:'1'},1000);
				})
			});			
			
			var tempPostEl = json.result.primaryTopic;
			
			// Store the post ID's that the Orgvis.vars.postInQuestion reports to
			var piqrtSlug = Orgvis.getSlug(tempPostEl._about);
			Orgvis.vars.postInQuestionReportsTo.push(piqrtSlug);
			
			//log("Working out PIQRTSLUG...");
			
			if(typeof tempPostEl.reportsTo != 'undefined') {
				for(var a=tempPostEl.reportsTo.length;a--;){
					//log(tempPostEl);
					if(typeof tempPostEl.reportsTo[a]._about != 'undefined'){
						//log("piqrtSlug _about = "+tempPostEl.reportsTo[a]._about);
						piqrtSlug = Orgvis.getSlug(tempPostEl.reportsTo[a]._about);
					} else {
						//log("piqrtSlug = "+tempPostEl.reportsTo[a]);
				 		piqrtSlug = Orgvis.getSlug(tempPostEl.reportsTo[a]);	
					}
					Orgvis.vars.postInQuestionReportsTo.push(piqrtSlug);
											
					if(typeof tempPostEl.reportsTo[a].reportsTo != 'undefined'){
						tempPostEl = tempPostEl.reportsTo[a];						
						a=a+1;
					} else {
					
					}
				}
			} else {
				//Orgvis.notify("Info","Post in question doesn't report to anybody...",true,"error_postDoesntReport");
			}
					
		} else {
			Orgvis.notify("Error","Could not extract the main post's data from API response",true, "error_rootPost");		
		}	
	},
	loadOrganogram:function(json) {
							
		//log("loading organogram");
									
		// Search for the post in question
		for(var i=0;i<json.result.items.length;i++){
			if(Orgvis.vars.postInQuestion._about == json.result.items[i]._about){
				Orgvis.vars.postInQuestion = json.result.items[i];
			}
		}
		
		//log('post in question:');
		//log(Orgvis.vars.postInQuestion);
		
		/*
		 * Establish the first node of the organogram 
		 * (the post that doesn't report to any other posts)
		 */
		var originalPostInQuestion = Orgvis.vars.postInQuestion;
		var _piq = Orgvis.vars.postInQuestion;
		
		if(typeof _piq.reportsTo != 'undefined') {
			for(var j=0;j<_piq.reportsTo.length;j++){
				if(typeof _piq.reportsTo[j].reportsTo != 'undefined' && _piq.reportsTo[j].label != 'undefined' && typeof _piq.reportsTo[j]._about != 'undefined'){
					_piq = _piq.reportsTo[j];
					j=j-1;
				} else if(typeof _piq.reportsTo[j]._about != 'undefined') {
					Orgvis.vars.firstNode = Orgvis.makeNode(_piq.reportsTo[j]);
					//log('firstNode:');
					//log(Orgvis.vars.firstNode);	
				} else {
					Orgvis.vars.firstNode = Orgvis.makeNode(_piq);								
					//log('firstNode:');
					//log(Orgvis.vars.firstNode);	
				}
			}
		} else {
			Orgvis.vars.firstNode = Orgvis.makeNode(_piq);
			//log('firstNode:');
			//log(Orgvis.vars.firstNode);						
		}
		
		if(Orgvis.vars.firstNode.data.reportsTo.length > 0){
			Orgvis.notify("Info","Top post reports to a post with missing or incorrect information",true,"top_post_missing");
			Orgvis.vars.firstNode.data.reportsTo = 'error';
			Orgvis.vars.postInQuestionReportsTo.splice(Orgvis.vars.postInQuestionReportsTo.length-1,1);
		}
				
		Orgvis.vars.postInQuestion = originalPostInQuestion;
		
		var options = {
			//childrenAdded:true
			//firstBuild:true
		};
		
		Orgvis.buildPostList(json,options);
		
// Once post list has been built, fire off the API calls to 
// retrieve each post's statistics data
//		Orgvis.getStatsData();
		
		Orgvis.vars.global_postJSON = Orgvis.connectPosts();
		
		Orgvis.vars.postList[Orgvis.vars.global_post].data.childrenAdded = true;
				
		for(var i=Orgvis.vars.apiResponses.length;i--;){			
			if(Orgvis.vars.apiResponses[i].result._about.indexOf("junior-staff") > 0){
				//log("connectJuniorPosts: found junior-staff data");
				Orgvis.connectJuniorPosts(Orgvis.vars.apiResponses[i]);	
			}
		}
		
		Orgvis.setChildrenAdded(Orgvis.vars.postList[''+Orgvis.vars.global_post]);
		
		//groupSamePosts(Orgvis.vars.global_postJSON,false);
		
		// load json data
		Orgvis.vars.global_ST.loadJSON(Orgvis.vars.global_postJSON);
		
		// compute node positions and layout
		Orgvis.vars.global_ST.compute();
		Orgvis.vars.global_ST.onClick(Orgvis.vars.global_ST.root);
		
		//Orgvis.changeLog("Aligning node ...",true);
		Orgvis.notify("Info","Aligning node...",false,"aligning");	

		Orgvis.updateFilter();
		
		var t = 0;
		var c = Orgvis.vars.postInQuestionReportsTo.length;
		//log("start c="+c);
		setTimeout(function(){	
			t = setInterval(function(){
				if(c == 1){
					if(!Orgvis.vars.global_ST.busy){
						clearInterval(t);
						Orgvis.vars.global_ST.onClick($("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1]).attr("id"));
						$("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1]).click();
						$("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1]).css("background-color","#FFFFFF");
						//Orgvis.hideLog();
						$("div#"+"aligning").trigger("jGrowl.close").remove();
						Orgvis.vars.ST_move = false;
						//log("Orgvis.vars.ST_move:"+Orgvis.vars.ST_move);
						
						return false;
					}
					
				} else {
					if(!Orgvis.vars.global_ST.busy){
						Orgvis.vars.global_ST.onClick($("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1]).attr("id"));
						c--;
					}
				}				
			},250);
		},500);	
		//end

		Orgvis.displayDataSources();

	},
	makeNode:function(item) {
		
		var node = {
				id:$.generateId(),
				name:"",
				data:{
					comment:item.comment,
					note:item.note,
					postIn:[],
					reportsTo:[],
					heldBy:[],
					salaryRange:[],
					totalWorkingTime:0
				},
				children:[]
		};
		
		if(typeof item._about != 'undefined') {
			node.data.uri = item._about;
		}
		
		if(typeof item.label != 'undefined'){
			node.name = item.label[0];
		} else {
			node.name = "?";
		}

		if(typeof item.grade != 'undefined' && typeof item.grade.label != 'undefined') {
				node.data.grade = item.grade.label[0];
		}

		if(typeof item.postIn != 'undefined'){
			for(var a=item.postIn.length;a--;){		
				node.data.postIn.push(item.postIn[a]);
				if(item.postIn[a]._about.indexOf("/unit/") > 0){
					if(typeof Orgvis.vars.unitList[Orgvis.getSlug(item.postIn[a]._about)] == 'undefined'){
						Orgvis.vars.unitList[Orgvis.getSlug(item.postIn[a]._about)] = {
							name:item.postIn[a].label[0],
							uri:item.postIn[a]._about,
							count:1
						};		
					} else {
						Orgvis.vars.unitList[Orgvis.getSlug(item.postIn[a]._about)].count++;
					}
				}
			}		
		}
		
		// Handle posts that report to more than one post
		if(typeof item.reportsTo != 'undefined'){
			for(var a=item.reportsTo.length;a--;){
				if(typeof item.reportsTo[a]._about != 'undefined'){
					node.data.reportsTo.push(item.reportsTo[a]._about);
				} else {
					node.data.reportsTo.push(item.reportsTo[a]);
				}
			}	
		}
		
		// Handle posts that are held by more than one person (before grouping)
		if(typeof item.heldBy != 'undefined'){	
			for(var a=item.heldBy.length;a--;){
			
				var person = {
						reportsToPostURI:[],
						salaryCostOfReports:-1,
						workingTime:0
				};
				
				var p = item.heldBy[a];
							
				if(typeof p.name != 'undefined'){
					person.foafName = p.name;
				}
				if(typeof p.phone != 'undefined'){
					person.foafPhone = p.phone.label[0];
				}
				if(typeof p.email != 'undefined'){
					person.foafMbox = p.email.label[0];
				}
				if(typeof p.tenure != 'undefined' && typeof p.tenure.workingTime != 'undefined'){
					person.workingTime = p.tenure.workingTime;
				}
				if(typeof p.profession != 'undefined' && typeof p.profession.prefLabel != 'undefined'){
					person.profession = p.profession.prefLabel;
				}
				if(typeof item._about != 'undefined'){
					person.holdsPostURI = item._about;
				}
				if(typeof item.comment != 'undefined'){
					person.comment = item.comment;
				}
				if(typeof item.note != 'undefined'){
					person.note = item.note;
				}
								
				node.data.totalWorkingTime += person.workingTime;
				
				if(typeof item.reportsTo != 'undefined'){
					for(var b=item.reportsTo.length;b--;){
						person.reportsToPostURI.push(item.reportsTo[b]._about);
					}
				}
				
				node.data.heldBy.push(person);
			}
		} else {
			// Create a dummy person for a vacant post
			var person = {
					foafName:"Vacant",
					holdsPostURI:item._about,
					reportsToPostURI:[],
					salaryCostOfReports:-1,
					workingTime:0
			};
			if(typeof item.comment != 'undefined'){
				person.comment = item.comment;
			}
			if(typeof item.note != 'undefined'){
				person.note = item.note;
			}
			if(typeof item.reportsTo != 'undefined'){
				for(var b=item.reportsTo.length;b--;){
					person.reportsToPostURI.push(item.reportsTo[b]._about);
				}
			}
			
			node.data.heldBy.push(person);
		}

		if(typeof item.salaryRange != 'undefined'){
			if(typeof item.salaryRange.label != 'undefined'){
				// Post has one salary range
				//log(node.name+" has one salary range");
				node.data.salaryRange.push(item.salaryRange.label[0]);
			} else {
				// Post has more than one salary range
				//log(node.name+" has more than one salary range");
				for(var i in item.salaryRange){
					node.data.salaryRange.push(item.salaryRange[i].label[0]);	
				}
			}
		} else {
			// No salary present for post
		}
				
		//log("made node:");
		//log(node);

		return node;
	},
	makeJuniorPostNode:function(el){
		
		//log("makeJuniorPostNode: using item:");
		//log(el);
		
		/*
		el.label[0]		B1/BAND B1 Project Manager (Operational Delivery) in 
						Civil Service Capabilities Group reporting to post 93 FTE at 31/03/2011
					
		el.fullTimeEquivalent 						1 or 2
		el.atGrade.prefLabel 						Grade B1/BAND B1
		el.atGrade.payband.prefLabel 				B1/BAND B1 Payband
		el.atGrade.payband.salaryRange.label[0]		£44,000 - £53,999
		el.atGrade.payband.salaryRange.prefLabel	B1/BAND B1 Payband
		el.withJob.prefLabel						Project Manager
		el.withProfession.prefLabel					Operational Delivery
		el.reportingTo.label[0]						Deputy Director, Capability Review
		el.inUnit.label[0]							Civil Service Capabilities Group
		*/
		
		var node = {
				id:$.generateId(),
				name:"",
				data:{
					type:'junior_posts',
					nodeType:'jp_child',
					total:0,						// Used for grouping junior staff
					fullName:'?',
					salaryRangeVal:0,
					fullTimeEquivalent:0,
					unit:{},
					reportingTo:{}
				},
				children:[]
			};
		
		if(typeof el.label != 'undefined' && typeof el.label[0] != 'undefined'){
			node.data.fullName = el.label[0];
		}
		
		if(typeof el.atGrade != 'undefined'){		

			if(typeof el.atGrade.prefLabel != 'undefined'){
				node.data.grade = el.atGrade.prefLabel;
			} else{
				node.data.grade = "Other";
			}
			
			if(typeof el.atGrade.payband != 'undefined'){

				if(typeof el.atGrade.payband.prefLabel != 'undefined'){
					node.data.payband = el.atGrade.payband.prefLabel;
				} else {
					node.data.payband = "No payband";
				}
		
				if(typeof el.atGrade.payband.salaryRange != 'undefined') {

					var salaryRangeLabel, salaryRangeValue;
			  								
					if(typeof el.atGrade.payband.salaryRange.label != 'undefined'){
						salaryRangeLabel = el.atGrade.payband.salaryRange.label[0];
			  			salaryRangeValue = salaryRangeLabel.replace(/£/g,'');
			  			salaryRangeValue = salaryRangeValue.split(" - ");
			  			salaryRangeValue = salaryRangeValue[0];
			  			salaryRangeLabel = addCommas(salaryRangeLabel);
			  			node.data.salaryRangeVal = salaryRangeValue;
			  			node.data.salaryRange = salaryRangeLabel;					
					} else {
						node.data.salaryRangeVal = 0;
						node.data.salaryRange = "Salary not disclosed";
					}
					
			  	} else {
			  		node.data.salaryRange = "Salary not disclosed";
			  	}
			} else {
				node.data.payband = "Payband not disclosed";
				node.data.salaryRange = "Salary not disclosed";			
			}
		} else {
			node.data.grade = "Other";
			node.data.payband = "Payband not disclosed";
			node.data.salaryRange = "Salary not disclosed";
			node.data.salaryRangeVal = "0";
		}
			
		if(typeof el.fullTimeEquivalent != 'undefined'){
			node.data.fullTimeEquivalent = el.fullTimeEquivalent;
		}
		
		if(typeof el.withJob != 'undefined'){
			if(typeof el.withJob.prefLabel != 'string'){
				node.name = el.withJob.prefLabel[0];
				node.data.job = el.withJob.prefLabel[0];
			} else {
				node.name = el.withJob.prefLabel;
				node.data.job = el.withJob.prefLabel;
			}
		} else {
			node.name = "Job not disclosed";
			node.data.job = "Job not disclosed";
		}
		
		if(typeof el.withProfession != 'undefined'){
			if(typeof el.withProfession.prefLabel != 'string'){
				node.data.profession = el.withProfession.prefLabel[0];
			} else {
				node.data.profession = el.withProfession.prefLabel;
			}
		} else {
			node.data.profession = "Other"
		}
		
		if(typeof el.inUnit != 'undefined' && typeof el.inUnit.label != 'undefined' && typeof el.inUnit._about != 'undefined'){	
			node.data.unit.label = el.inUnit.label[0];
			node.data.unit.uri = el.inUnit._about;			
		} else {
			node.data.unit.label = "Other";
			node.data.unit.uri = "Other";
		}
		
		if(typeof el.reportingTo != 'undefined' && typeof el.reportingTo.label != 'undefined' && typeof el.reportingTo._about != 'undefined'){
			node.data.reportingTo.label = el.reportingTo.label[0];
			node.data.reportingTo.uri = el.reportingTo._about;
		}
		
		//log('makeJuniorPostNode: node made:');
		//log(node);

		return node;
	},
	makeJuniorPostParentNode:function(postID){
		
		// The 'Junior Post' node parent for junior staff
		var node = {		
			id:$.generateId(),
			name:"Junior Posts",
			data:{
				total:0,
				fteTotal:0,
				nodeType:'jp_parent',
				type:'junior_posts',
				colour:'#FFFFFF',
				listID:"JP_"+postID
			},
			children:[]
		};		
		
		return node;
	},
	makeNoJuniorPostNode:function(){
		
		// Empty node for posts that don't have any junior posts
		var node = {			
			id:$.generateId(),
			name:"No Junior Posts",
			data:{
				total:0,
				nodeType:'jp_none',
				type:'junior_posts',
				colour:'#000000'
			},
			children:[]
		};	
		
		return node;
	},
	makeJuniorPostGroup:function(groupName,prop){
		
		var node = {			
			id:$.generateId(),
			name:groupName,
			data:{
				fteTotal:0,
				nodeType:'jp_group',
				type:'junior_posts',
				colour:Orgvis.vars.colours[Orgvis.vars.jpColourCounter],
				property:prop
			},
			children:[]	            		
		};	

		if(typeof groupName != 'string'){
			node.name = groupName[0];
		}
				
		if(Orgvis.vars.jpColourCounter == Orgvis.vars.colours.length-1){
			Orgvis.vars.jpColourCounter = 0;
		} else {
			Orgvis.vars.jpColourCounter++;
		}
				
		return node;	
	},	
	buildPostList:function(json, options){
		
		var items = json.result.items;		
		
		var fNodeID = Orgvis.getSlug(Orgvis.vars.firstNode.data.uri);
		Orgvis.vars.postList[fNodeID] = Orgvis.vars.firstNode;
		// Push an empty Junior Posts node to the first node.
		// Orgvis.vars.postList[fNodeID].children.push(Orgvis.makeNoJuniorPostNode());
		
		var addNoJuniorPosts = true;
		
		// Build an associative array of posts using their post ID
		for(var i in items){
			var postID = Orgvis.getSlug(items[i]._about);
			// If the key doesn't exist already
			if (!Orgvis.vars.postList[postID]) {
				// Create the key and give it a value
				Orgvis.vars.postList[postID] = Orgvis.makeNode(items[i]);
				if(typeof options.childrenAdded != 'undefined'){
					Orgvis.vars.postList[postID].data.childrenAdded = options.childrenAdded;
				}
			}
		}
		
		//log("postList:");
		//log(Orgvis.vars.postList);	
	},	
	connectPosts:function(){
	
		//log("connectPosts:");
		var visJSON;
		
		var postList = Orgvis.vars.postList;
		
		for(var i in postList) {
			
			// Find the reportsTo values for each post
			//log("postList[i]:");
			//log(postList[i]);
			
			if(typeof postList[i].data.reportsTo != 'undefined' && postList[i].data.reportsTo.length > 0 && postList[i].data.reportsTo != 'error') {
				//log("postList[i].data:");
				//log(postList[i].data);
				var postID = Orgvis.getSlug(postList[i].data.reportsTo[0]);
				// Use the postID slug from the reportsTo value as a pointer in the associative array
				// to connect the post to it's parent. 
				if (Orgvis.vars.postList[postID]) {
					//var elID = Orgvis.getSlug(el.data.uri);
					var connectPost = true;
					var children = Orgvis.vars.postList[postID].children;
					for(var j in children){
						if(postList[i].id == children[j].id){
							//log("not connecting posts:");
							//log(el.id);
							//log(Orgvis.vars.postList[postID].children[i].id);
							connectPost = false;
						}
					}
					if(connectPost){
  						Orgvis.vars.postList[postID].children.push(postList[i]);
  					}
				}
			} else {
				log("postList[i] doesn't report to anyone");
				visJSON = postList[i];
			}
			
		}
			
		//log("visJSON:")
		//log(visJSON);
	
		return visJSON;
	
	},
	connectJuniorPosts:function(json){
		
		//log("Connecting junior posts:");
		
		var items = json.result.items;
		//log(items);
		
		var postChildren = [];
		
		var byUnit = {};
		var byGrade = {};
		var byProfession = {};
		/*
		el.label[0]		B1/BAND B1 Project Manager (Operational Delivery) in 
						Civil Service Capabilities Group reporting to post 93 FTE at 31/03/2011
					
		el.fullTimeEquivalent 						1 or 2
		el.atGrade.prefLabel 						Grade B1/BAND B1
		el.atGrade.payband.prefLabel 				B1/BAND B1 Payband
		el.atGrade.payband.salaryRange.label[0]		£44,000 - £53,999
		el.atGrade.payband.salaryRange.prefLabel	B1/BAND B1 Payband
		el.withJob.prefLabel						Project Manager
		el.withProfession.prefLabel					Operational Delivery
		el.reportingTo.label[0]						Deputy Director, Capability Review
		el.inUnit.label[0]							Civil Service Capabilities Group
		*/		
		var len = items.length;
		for(var i=len;i--;) {
			
			//log("connecting junior post:");
			//log(items[i]);
			
			var pSlug,gSlug,uSlug;
						
			if(typeof items[i].withProfession != 'undefined'){
				pSlug = Orgvis.getSlug(items[i].withProfession._about);
			} else {
				pSlug = "other";
			}
			if(typeof items[i].atGrade != 'undefined'){
				gSlug = Orgvis.getSlug(items[i].atGrade._about);
			} else {
				gSlug = "other";
			}			
			if(typeof items[i].inUnit != 'undefined'){
				uSlug = Orgvis.getSlug(items[i].inUnit._about);
			} else {
				uSlug = "other";
			}			
			
			// Group by profession	
			if(typeof byProfession[pSlug] != 'undefined'){
				byProfession[pSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byProfession[pSlug].data.fteTotal += items[i].fullTimeEquivalent;
			} else {
				if(typeof items[i].withProfession != 'undefined'){
					byProfession[pSlug] = Orgvis.makeJuniorPostGroup(items[i].withProfession.prefLabel,"Profession");
				} else {
					byProfession[pSlug] = Orgvis.makeJuniorPostGroup("Other","Profession");
				}
				byProfession[pSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byProfession[pSlug].data.fteTotal = items[i].fullTimeEquivalent;
			}
			// Group by grade
			if(typeof byGrade[gSlug] != 'undefined'){
				byGrade[gSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byGrade[gSlug].data.fteTotal += items[i].fullTimeEquivalent;
			} else {
			  	
			  	var salaryRange;
			  	if(typeof items[i].atGrade.payband != 'undefined' && typeof items[i].atGrade.payband.salaryRange != 'undefined'){
			  		salaryRange = addCommas(items[i].atGrade.payband.salaryRange.label[0]);
			  	} else {
			  		salaryRange = "Salary not disclosed";
			  	}
				byGrade[gSlug] = Orgvis.makeJuniorPostGroup(items[i].atGrade.prefLabel, salaryRange);
				byGrade[gSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byGrade[gSlug].data.fteTotal = items[i].fullTimeEquivalent;
			}				
			// Group by unit
			if(typeof byUnit[uSlug] != 'undefined'){
				byUnit[uSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byUnit[uSlug].data.fteTotal += items[i].fullTimeEquivalent;
			} else {
				byUnit[uSlug] = Orgvis.makeJuniorPostGroup(items[i].inUnit.label[0], "Unit");
				byUnit[uSlug].children.push(Orgvis.makeJuniorPostNode(items[i]));
				byUnit[uSlug].data.fteTotal = items[i].fullTimeEquivalent;
			}	
						
			// If a JP reports to a post
			if(typeof items[i].reportingTo != 'undefined') {
				//log("connectJuniorPosts: found junior post");
				var postID = Orgvis.getSlug(items[i].reportingTo._about);
				//log("postID: "+postID);
		
				// might not be a post to connect it to
				if (Orgvis.vars.postList[postID]) {
										
					// Remove the empty junior staff node from the post that now has junior staff
					var postChildren = Orgvis.vars.postList[postID].children;
				
					for(var j in postChildren){
						if(postChildren[j].name == "No Junior Posts"){
							//log("Removing node: "+postChildren[j].name);
							postChildren.splice(j,1);
						}
					}					
				
					var addJPNode = true;
				
					for(var m in postChildren){
						//log("searching postChildren fo JPNode:");
						//log(postChildren[m]);
						if(postChildren[m].name == "Junior Posts"){
							//log("Post already has Junior Post connected");
							addJPNode = false;
						}
					}
				
					if(addJPNode){
						// Add the 'Junior Posts' node to the post that holds the junior staff
						postChildren.push(Orgvis.makeJuniorPostParentNode(postID));
						//log("Added juniorPostsNode");
					}

					// Loop through the posts children
					for(var k in postChildren){

						// If one of the posts's children is named "Junior Posts'
						if(postChildren[k].name == "Junior Posts"){

							Orgvis.vars.postList["JP_"+postID] = postChildren[k];

							// Add the actual junior staff item to the Junior Posts node
							postChildren[k].children.push(Orgvis.makeJuniorPostNode(items[i]));
							postChildren[k].data.fteTotal += items[i].fullTimeEquivalent;
						}
					
						postChildren[k].data.fteTotal = Math.round(postChildren[k].data.fteTotal*100)/100;
						
						postChildren[k].data.byProfession = [];
						for(var p in byProfession){
							byProfession[p].children.sort(sort_salaryRangeVal());
							postChildren[k].data.byProfession.push(byProfession[p]);
						}
						postChildren[k].data.byProfession.sort(sort_name());

						postChildren[k].data.byUnit = [];
						for(var u in byUnit){
							byUnit[u].children.sort(sort_salaryRangeVal());
							postChildren[k].data.byUnit.push(byUnit[u]);
						}
						postChildren[k].data.byUnit.sort(sort_name());
						
						postChildren[k].data.byGrade = [];
						for(var g in byGrade){
							byGrade[g].children.sort(sort_name());
							postChildren[k].data.byGrade.push(byGrade[g]);
						}
						postChildren[k].data.byGrade.sort(sort_prop());
						
						postChildren[k].children.sort(sort_salaryRangeVal());
						postChildren[k].data.unGrouped = postChildren[k].children;
			
					} // end for loop
				} // end if postID exists
			}	// end if items[i] reportsTo						
		} // end for loop			
		
	},
	setChildrenAdded:function(pNodes){
		// Find the post in the postList,
		// traverse through all of it's newly added children
		// and set their "childrenAdded" flags to true.
		var nodes = [];
		
		if(pNodes != 'undefined'){
			// check to see if pNodes is an object or an array
			if(pNodes.constructor.toString().indexOf("Array") == -1){
				nodes.push(pNodes);
			} else {
				nodes = pNodes;
			}
			
			var len = nodes.length;
			for(var i=len;i--;){
			
				if(nodes[i].name != "No Junior Posts" && nodes[i].data.nodeType != "jp_child" && nodes[i].data.type != 'junior_posts'){

					try {
						var visNode = Orgvis.vars.global_ST.graph.getNode(nodes[i].id);
						visNode.data.childrenAdded = true;
					} catch(e){
						log(e)
					};
					
					var addNoJuniorPosts = true;
					
					var children = nodes[i].children;
					var len2 = children.length;
					for(var j=len2;j--;){
						if(children[j].name == "Junior Posts" || children[j].name == "No Junior Posts"){
							addNoJuniorPosts=false;						
						}
					}
					
					if(addNoJuniorPosts){
						children.push(Orgvis.makeNoJuniorPostNode());
					}
				}

			} // end for
		}
		//return false;

	},
	reloadPost:function() {
	
		Orgvis.vars.global_ST.loadJSON(Orgvis.vars.global_postJSON);
		Orgvis.vars.global_ST.compute();
		Orgvis.vars.global_ST.onClick(Orgvis.vars.global_ST.root);
		
		setTimeout(function(){
			if(!Orgvis.vars.global_ST.busy){
				$("div.post_"+Orgvis.vars.global_post).click();
			} else {
				setTimeout(function(){
					$("div.post_"+Orgvis.vars.global_post).click();
				},1000);							
			}
		},1000);
							
		Orgvis.displayDataSources();
	},
	groupSamePosts:function(json,firstNodeFound) {
			
		if( typeof json == "object" ) {
		
			$.each(json, function(k,v) {
			
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
				
				return Orgvis.groupSamePosts(v,firstNodeFound); 
			});
		}		
	},
	loadPostInfobox:function(node){
		
		//log("loadPostInfobox()");
		
		var postID = Orgvis.getSlug(node.data.uri);
		var postUnit, tempUnitID, tempUnitLabel;
	
		//log(node);
		
		var postIn = node.data.postIn;
		for(var j=postIn.length;j--;){
			if(postIn[j]._about.indexOf("/unit/") >= 0){
				tempUnitID = Orgvis.getSlug(postIn[j]._about);
				tempUnitLabel = postIn[j].label[0];
				postUnit = postIn[j]._about;
			}
		}
		
		//log("postUnit = "+postUnit);
	
		// Construct the HTML for the infobox
		var html = '<h1>'+node.name+'</h1>';			
		
		if(node.data.heldBy.length > 0){
			
			var nd = node.data;
			
			html += '<div class="panel heldBy ui-accordion ui-widget ui-helper-reset ui-accordion-icons">';
		
			for(var i=nd.heldBy.length; i--;) {
				
				var hb = node.data.heldBy;
				
				var tempID = Orgvis.getSlug(hb[i].holdsPostURI);	
								
				if(typeof hb[i].foafName != 'undefined'){
					html += '<h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"><a class="name infobox_'+tempID+'">'+hb[i].foafName+'</a></h3>';
				}else {
					html += '<h3 class="ui-accordion-header ui-helper-reset ui-state-default ui-corner-all"><a class="name infobox_'+tempID+'">?</a></h3>';		
				}
		
				html += '<div class="content ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">';
				
				html+= '<p class="id"><span>Post ID</span><span class="value">'+tempID+'</span><a class="data postID" target="_blank" href="http://'+Orgvis.vars.apiBase+'/doc/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'">Data</a><a class="data center_organogram" href="?'+Orgvis.vars.global_orgSlug+'='+Orgvis.vars.global_postOrg+'&post='+tempID+(Orgvis.vars.previewMode?'&preview=true':'')+'">Load organogram</a></p>';

				if(typeof nd.grade != 'undefined'){
						html += '<p class="grade"><span>Grade</span><span class="value">'+nd.grade+'</span><a class="data" target="_blank" href="../post-list?'+Orgvis.vars.global_orgSlug+'='+Orgvis.vars.global_postOrg+'&property=grade&value='+nd.grade+(Orgvis.vars.previewMode?'&preview=true':'')+'">Post list</a></p>';
				}				
				
				if(typeof nd.salaryRange[i] != 'undefined'){
					html += '<p class="salary"><span>Salary</span><span class="value">'+addCommas(nd.salaryRange[i])+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/doc/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'">Data</a></p>';					
				}			
				
				var postObj = Orgvis.vars.postList[tempID];
							
				if(nd.gotStats) {
					html += '<p class="salaryReports"><span>Combined salary of reporting posts</span><span class="value">'+nd.stats.salaryCostOfReports.formatted+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/doc/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'/statistics" value="'+nd.stats.salaryCostOfReports.value+'">Data</a><span class="date">'+nd.stats.date.formatted+'</span>';	
				} else {
					html += '<p class="salaryReports"><span>Combined salary of reporting posts </span><span class="value">Checking...</span><img class="salaryReports" width="14" height="14" src="../images/loading_white.gif"></p>';
				}				
				
				if(hb[i].workingTime > 0){
					html+='<p class="workingTime"><span>Working time</span><span class="value">'+hb[i].workingTime+'</span></p>';
				}

							
				if(typeof hb[i].comment != 'undefined'){
					html+='<p class="comment"><span>Role</span><span class="text">'+hb[i].comment+'</span></p>';
				}
				
				if(typeof hb[i].note != 'undefined'){
					html+='<p class="comment"><span>Notes</span><span class="text">'+hb[i].note+'</span></p>';
				}
	
				if(typeof hb[i].profession != 'undefined'){
					if(typeof hb[i].profession != 'string'){
						html+='<p class="profession"><span>Profession</span><span class="value">'+hb[i].profession[0]+'</span></p>';
					} else {
						html+='<p class="profession"><span>Profession</span><span class="value">'+hb[i].profession+'</span></p>';
					}
				}
		
				if(typeof hb[i].foafMbox != 'undefined'){
					html += '<p class="email"><span>Email</span><span class="value">'+hb[i].foafMbox+'</span></p>';
				}
				
				if(typeof hb[i].foafPhone != 'undefined'){
					html += '<p class="tel"><span>Phone</span><span class="value">'+hb[i].foafPhone+'</span></p>';
				}
						
				html+= '<p class="unit"><span>Unit(s)</span><span class="value">'+tempUnitLabel+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/doc/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/unit/'+tempUnitID+'">Data</a>';
		
				if(typeof hb[i].notes != 'undefined'){
					html+='<p class="notes"><span>Notes</span><span class="text">'+hb[i].notes+'</span></p>';
				}
						
				html+= '</p>';
				
				html += '</div><!-- end content -->';
				
			} // end for loop
	
			html+= '</div><!-- end panel -->';

		} else {
			html = '<h1>'+node.name+'</h1>';			
			html += '<p>This post is either currently not held or there is no data present for the person who holds this post.</p>';
		}
				
		html+= '<a class="close">x</a>';
		
		$("#infobox").html(html);
		Orgvis.setInfoBoxLinks();
		$("#infobox").show();
		$("div.heldBy").show();
		
		if(Orgvis.vars.firstLoad){
			$("div.panel h3 a.infobox_"+Orgvis.vars.global_post).click(); 
			Orgvis.vars.firstLoad=false;
			Orgvis.vars.reOpen=false;
		} else {
			$("div.panel h3 a").eq(0).click();
			Orgvis.vars.reOpen=true;
		}
			
	},
	loadJuniorPostInfoBox:function(node){

		// Construct the HTML for the infobox
		//log("Building junior post infobox");
		//log(node);
		var nd = node.data;
		var html = '<h1>'+node.name+'</h1>';
		html += '<div class="panel ui-accordion ui-widget ui-helper-reset ui-accordion-icons">';
		html += '<div class="content ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top">';

		if(typeof nd.job != 'undefined'){
			html += '<p class="profession"><span>Profession</span><span class="value">'+nd.job+'</span></p>';
		}
		
		if(typeof nd.profession != 'undefined'){
			html += '<p class="profession"><span>Profession</span><span class="value">'+nd.profession+'</span></p>';
		}		
		
		html += '<p class="fte"><span>Full Time Equivalent</span><span class="value">'+nd.fullTimeEquivalent+'</span></p>';
		html += '<p class="grade"><span>Grade</span><span class="value">'+nd.grade+'</span></p>';
		html += '<p class="payband"><span>Payband</span><span class="value">'+nd.payband+'</span></p>';
		html += '<p class="paybandRange"><span>Payband Salary Range</span><span class="value">'+nd.salaryRange+'</span></p>';
		html += '<p class="reportsTo"><span>Reports To</span><span class="value">'+nd.reportingTo.label+'</span></p>';
		html += '<p class="unit"><span>Unit</span><span class="value">'+nd.unit.label+'</span></p>';
		
		html += '</div>'; // end content
		html += '</div>'; // end panel
		
		html += '<a class="close">x</a>';	
				
		$("#infobox").html(html);
		Orgvis.setInfoBoxLinks();
		$("#infobox").show();
		$("#infobox div.content").show();
	},
	displayDataSources:function() {
		
		// Need to use a foreach loop to identify the correct key's and values in the
		// new apiCallInfo object.
		
		//log("displaying data sources");
		
		$('div#apiCalls').hide();
		
		var html = '<p class="label">Data sources</p>';
		
		var callInfo = Orgvis.vars.apiCallInfo;
		var h=1;
		for(var i in callInfo){	
			//log(k);
			//log(v);
			
			$('div.apiCall.'+(h)).dialog('destroy');
			$('div.apiCall.'+(h)).remove();
			
			html += '<a class="source" data-id="'+(h)+'">'+(h)+'</a>';
			
			html += '<div class="apiCall '+(h)+'">';
			
			html += '<p class="title"><span>API call '+(h)+':</span>'+callInfo[i].title+'</p>';
			html += '<p class="description"><span>Description:</span>'+callInfo[i].description+'</p>';
			html += '<p class="url"><span>Endpoint URL:</span><a href="'+callInfo[i].url+'" target="_blank">'+callInfo[i].url+'</a></p>';	
	
			if(callInfo[i].parameters != ""){
				html += '<p class="params"><span>Parameters:</span></p>';
				
				var tempParams = callInfo[i].parameters.replace("?","").split("&");
						
				html += '<ul class="paramlist">';
				for(var j=0;j<tempParams.length;j++){
					html+= '<li>'+tempParams[j]+'</li>';
				}
				html += '</ul>';
			}
			
			html += '<p class="formats"><span>Formats:</span>';
			html += '<a href="'+callInfo[i].url+'.rdf'+callInfo[i].parameters+'" target="_blank">RDF</a>';
			html += '<a href="'+callInfo[i].url+'.ttl'+callInfo[i].parameters+'" target="_blank">TTL</a>';
			html += '<a href="'+callInfo[i].url+'.xml'+callInfo[i].parameters+'" target="_blank">XML</a>';
			html += '<a href="'+callInfo[i].url+'.json'+callInfo[i].parameters+'" target="_blank">JSON</a>';
			html += '<a href="'+callInfo[i].url+'.html'+callInfo[i].parameters+'" target="_blank">HTML</a>';
			html += '</p>';
			//html += '<a class="close">x</a>';
			html += '</div><!-- end apiCall -->';
			
			h++;
			
		}	
		
		$('div#apiCalls').html(html);
				
		$('p.formats a').each(function(){
			$(this).button({text:true});
		});
		
		Orgvis.resetSourceLinks();
		
		$('div#apiCalls').show();
		
		return false;
	},	
	resetSourceLinks:function() {
		
		$('div.apiCall').each(function(){
			$(this).dialog({autoOpen:false, modal: true, position: 'center', title: 'API Call Information', resizable: false, width: 350, zIndex: 9999});
		});
		
		$('div#apiCalls a.source').button().click(function() {
			$('div.apiCall.'+$(this).attr("data-id")).dialog('open');
			return false;
		});		
			
		return false;
	},
	setInfoBoxLinks:function() {
	
		$("a.close").click(function(){
			$(this).parent().fadeOut();
		});		
		
		$('div.heldBy').accordion({clearStyle:true, navigation:true, autoHeight:false, collapsible:true, active:true});
		
		$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
		
		$('div.panel h3').eq(0).click();
		
		if($.browser.msie){
			$("div#infobox").corner();
		}
		
		return false;
	},
	updateFilter:function(){
		
		//log("updating filter");
		
		// Store select menu value
		var originalValue = $("select#filterBy").val();
		//log(originalValue);
		
		var array = [];
		
		for(var i in Orgvis.vars.unitList){
			array.push(Orgvis.vars.unitList[i]);
		}		
		
		array.sort(sort_name());
		
		var html = '<option value="none" data-type="none">--</option>';
		
		// Units	
		html += '<optgroup label="Unit">';
		for(var i in array){
			//log(Orgvis.vars.unitList[i]);
			html += '<option value="'+array[i].name+'" data-type="unit">'+array[i].name+' ('+array[i].count+')</option>';
		}
		html += '</optgroup>';
				
		// Other things

		$("select#filterBy").html(html);
		
		$("select#filterBy").unbind('change');
		$("select#filterBy").bind('change',function(){
			$("div.node").each(function(){
				if($(this).children("span.postIn").eq(0).html() == $("select#filterBy").val()){
					$(this).addClass("highlighted");
				} else {
					$(this).removeClass("highlighted");
				}
			});
		});
		
		if($.browser.msie && $.browser.version.substr(0,1)<8){} 
		else {
			$('a#filterBy-button').remove();
			$('ul#filterBy-menu').remove();
			$('select#filterBy').selectmenu({style:'dropdown',width:280,menuWidth:280});
		}		
		
		// Restore select menu value
		//log("setting new filter value");
		$("select#filterBy").val(originalValue);
		$("select#filterBy").selectmenu("refreshValue");
		
		$("div.node").each(function(){
			if($(this).children("span.postIn").eq(0).html() == $("select#filterBy").val()){
				$(this).addClass("highlighted");
			} else {
				$(this).removeClass("highlighted");
			}
		});

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
			setTimeout(function(){
				log("Making sure notification "+id.replace("success","loading")+" is closed!");
				$("div#loading_data").trigger("jGrowl.close").remove();
				$("div#"+id.replace("success","loading")).trigger("jGrowl.close").remove();
			},3000);			
		}
		

	},
	getSlug:function(string){
		var temp = string.split("/");
		return temp[temp.length-1];
	}
}; // end Orgvis


jQuery.fn.mousehold = function(timeout, f) {
	if (timeout && typeof timeout == 'function') {
		f = timeout;
		timeout = 33;
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
};

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
	Orgvis.vars.labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
	Orgvis.vars.nativeTextSupport = Orgvis.vars.labelType == 'Native';
	Orgvis.vars.useGradients = nativeCanvasSupport;
	Orgvis.vars.animate = !(iStuff || !nativeCanvasSupport);
})();

/* Unique ID generator */
$.generateId = function() {
	return arguments.callee.prefix + arguments.callee.count++;
};
$.generateId.prefix = 'Orgvis_ID_';
$.generateId.count = 0;

$.fn.generateId = function() {
	return this.each(function() {
		this.id = $.generateId();
	});
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

function dynamicSort(property) {
    return function (a,b) {
        return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    }
}

function sort_name() {
    return function (a,b) {
        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
    }
}

function sort_salaryRangeVal() {
    return function (a,b) {
        return (a.data.salaryRangeVal < b.data.salaryRangeVal) ? -1 : (a.data.salaryRangeVal > b.data.salaryRangeVal) ? 1 : 0;
    }
}

function sort_prop() {
    return function (a,b) {
        return (a.data.property < b.data.property) ? -1 : (a.data.property > b.data.property) ? 1 : 0;
    }
}

// fn to handle jsonp with timeouts and errors
// hat tip to Ricardo Tomasi for the timeout logic
$.myJSONP = function(s,callName,n) {

	node = n || {name:"Unspecified"};
	
	//log("myJSONP, recevied node:");
	//log(node);

 	s.type = "GET";		
    s.dataType = (Orgvis.vars.useJSONP ? 'jsonp' : 'json');
	s.async = true;
	s.cache = true;
	
	if(!Orgvis.vars.useJSONP && s.url.indexOf("&callback=?") > 0){
		s.url = s.url.replace("?&callback=?","");
		s.url = s.url.replace("&callback=?","");
	}
	
	log("Type of JSON being used: "+s.dataType);
	log("API URL: "+s.url);
		   
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
    	log("callName: "+callName);
    	
    	var postID = "";
		try{
			postID = Orgvis.getSlug(node.data.uri);
		}catch(e){
			postID = "unknown";
		}
    	//Orgvis.showLog("Error requesting data for "+callName,false);
    	//log("Attempting to close loading notification for postID: "+postID);
    	
    	// Check for initial loading notifications
    	switch(callName)
    	{
    	
    		case "data" :
    			log("myJSONP - error - closing data notification");
    			$("div#loading_post").trigger("jGrowl.close").remove();
    			break;
    			
    		case "reporting posts" :
    			log("myJSONP - error - closing reporting posts data notification");
    			$("div#loading_reportingPosts").trigger("jGrowl.close").remove();
    			break;
    			
    		case "junior staff" :
    			log("myJSONP - error - closing junior staff notification");
	    	    $("div#loading_juniorStaff").trigger("jGrowl.close").remove();    	
    			break;
    		
    		case "reporting posts on demand" :
    			log("myJSONP - error - closing reporting posts data on demand notification");
    			$("div#loading_rp_onDemand_"+postID).trigger("jGrowl.close").remove();
    			break;
    			
    		case "junior staff on demand" :
    			log("myJSONP - error - closing junior staff on demand notification");
	    	    $("div#loading_jp_onDemand_"+postID).trigger("jGrowl.close").remove();    	
    			break;
    			    			
    		default :
    			log("myJSONP - error - closing default notification");
    			$("div#loading_" + postID).trigger("jGrowl.close").remove();
    			break;
		}
		
		Orgvis.notify("Error","Could not load "+node.name+"'s "+callName, true,"error_handler_"+postID);
		
		$("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
		var json = {
				result:{
					_about:s.url,
					items:[]
				}
    		};

		Orgvis.regData(json);					
    	
        // support jquery versions before and after 1.4.3
        //($.ajax.handleError || $.handleError)(s, o, msg, e);
    }
};

function log(info){
	Orgvis.vars.debug && window.console && console.log && console.log(info);
}

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
	        disabled: true
	    }).click(function() {
	        //window.location = $(this).attr("rel");
	    });
	    $( "button#dept" ).button({
	        text: true
	    }).click(function() {
	    	if(Orgvis.vars.previewMode){
	        	window.location = "../post-list?"+Orgvis.vars.global_orgSlug+"="+Orgvis.vars.global_postOrg+"&preview=true";
	        } else {
	        	window.location = "../post-list?"+Orgvis.vars.global_orgSlug+"="+Orgvis.vars.global_postOrg;	        
	        }
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

	$( "div#orientation" ).buttonset().click(function(value){
		if(value.target.id == "top"){
			Orgvis.vars.global_ST.canvas.opt.orientation = "top";
			Orgvis.vars.global_ST.refresh();
		}else if(value.target.id == "left"){
			Orgvis.vars.global_ST.canvas.opt.orientation = "left";
			Orgvis.vars.global_ST.refresh();
		}
	});
	
	$('label[for=left]').click();
	
	if($.browser.msie && $.browser.version.substr(0,1)<8) {} 
	else {
		$('select#filterBy').selectmenu({style:'dropdown',width:280,menuWidth:280});	
	}
	
	// Navigation controls
	$(function() { 
	    $("button#nav_up").button({
	        icons: { primary: "ui-icon-circle-arrow-n" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetY = Orgvis.vars.global_ST.canvas.translateOffsetY + 20;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(0,20,false);
	    });    
	    $("button#nav_down").button({
	        icons: { primary: "ui-icon-circle-arrow-s" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetY = Orgvis.vars.global_ST.canvas.translateOffsetY - 20;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(0,-20,false);  
	    });  
	    $("button#nav_left").button({
	        icons: { primary: "ui-icon-circle-arrow-w" },
	      	text: false
	     }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetX = Orgvis.vars.global_ST.canvas.translateOffsetX + 20;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(20,0,false);		
	    });  
	    $("button#nav_right").button({
	        icons: { primary: "ui-icon-circle-arrow-e" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetX = Orgvis.vars.global_ST.canvas.translateOffsetX - 20;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(-20,0,false);	
	    });
	    $("button#center").button({
	        icons: { primary: "ui-icon ui-icon-arrow-4-diag" },
	        text: false
	    }).click(function() {
	        Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height());	
	    });	    
	});
	
	$('div#right').children().css('visibility','visible');
	
	if($.browser.msie) {
		$("div#log").corner();
		$("div#right").corner("tl bl 10px");
	}
	
	if($.browser.msie && $.browser.version.substr(0,1)<7) {	
		// If less than IE7
	} else {
		$("div#right").show();
	}
	
	$(window).resize(function(){
		$("#infovis").width($(window).width()-0);
		$("#infovis").height($(window).height()-30);
		$("div.jGrowl.top-left").css("max-height",$(window).height()-80);
		$("div.jGrowl.top-left").css('height','expression( this.scrollHeight > '+$(window).height()-79+' ? "'+$(window).height()-80+'px" : "auto" )');
		
		try{
			Orgvis.vars.global_ST.canvas.resize($('#infovis').width(), $('#infovis').height()); 
		}catch(e){}
		
		if($.browser.msie && $.browser.version.substr(0,1)<8) {} 
		else {
			$('select#filterBy').selectmenu("refreshPosition");
		}		
	});
		
}); // end docready
