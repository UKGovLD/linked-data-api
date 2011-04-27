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
		animate:"",				// var for theJIT
		ST_move:true,			// custom var for use in core JIT code (controls tree moving on click)
		previewMode:false,		// Used to initialise authentication and to swap API locations
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
			'#A27AFE',			// purple
			'#8FFEDD',			// cyan
			'#E4C6A7',			// brown
			'#FFBBDD',			// pink
			'#E9E9C0',			// faded green
			'#A8A8FF' 			// blue
		],
		jpCounter:0,			// Number of junior posts
		jpColourCounter:0,		// Used to colour the junior post nodes
		postList:{},			// An associative array of posts (used for connecting nodes)
		postInQuestion:{},		// The node object of the post in question (PIQ)
		postInQuestionReportsTo:[],	// An array of node objects the PIQ reports to
		firstNode:{},			// The first node object of the organogram
		firstLoad:true,			// Used for reloading the vis without retrieving the data again
		autoalign:true,			// automatically center the organogram onclick
		reOpen:false,			//
		visOffsetX:180,			// horizontal positioning
		visOffsetY:0,			// vertical positioning
		JPcount:0,				// Junior post count
	 	apiBase:"",
	 	apiCallInfo: {},		// Stores information about each API call to be made}
		firstLoad_expectedApiResponses:3, // Used to make the app wait until the correct number of API responses have been gathered
		apiResponses:[],		// Stores JSON responses from the API
		cacheObj:{},			// An object to store API responses
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
			Orgvis.notify("Error","Cannot load organogram, no post selected!", true);
		} else{
			Orgvis.vars.global_post = postSlug;		
		}
			
		// Check for preview parameter
		if(pMode == "true"){
			log("Param: In preview mode");
			// In preview mode
			
			/*
			if($.cookie("organogram-preview-mode") == "true") {
				// Already authenticated
				Orgvis.vars.previewMode = pMode;
				Orgvis.vars.apiBase = "organogram.data.gov.uk";
				Orgvis.initSpaceTree(reload);
			} else {
				// Ask for username and pass
				Orgvis.showLogin();
			}
			*/
			
			Orgvis.vars.apiBase = "organogram.data.gov.uk";
			Orgvis.vars.previewParam = true;			
			Orgvis.initSpaceTree(reload);

		} else if($.cookie("organogram-preview-mode")) {
			log("Cookie: In preview mode");
			// In preview mode
			Orgvis.vars.previewMode = true;
			$("span#previewModeSign").show();
			Orgvis.vars.apiBase = "organogram.data.gov.uk";
			Orgvis.initSpaceTree(reload);
		} else {
			log("Not in preview mode");
			// Not in preview mode
			Orgvis.vars.apiBase = "reference.data.gov.uk";
			Orgvis.initSpaceTree(reload);
		}		
		
	},
	showLogin:function(){
		
		$('div#login').dialog({
			autoOpen:true, 
			buttons: [{
	        	text: "OK",
	        	click: function() { 
	        		// Check for wrong login details
	        		if($('div#login input#username').attr("value").length > 0 && $('div#login input#password').attr("value").length) {
	        			$("div#login p.login-message").hide();
	        			$("div#login p.logging-in").slideDown(1000);

						// Store username in cookie
						$.cookie('organogram-username', $('div#login input#username').attr("value"), { expires: 1 });
						// Store password in cookie
						$.cookie('organogram-password', $('div#login input#password').attr("value"), { expires: 1 });
												
						Orgvis.vars.apiBase = "organogram.data.gov.uk";
    					Orgvis.vars.apiCallInfo.rootPost = {
							title:"Retrieval of root post information",
							description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
							url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post,
							parameters:"",
							complete:false
						};	


	        			$.ajax({
							url: Orgvis.vars.apiCallInfo.rootPost.url+".json"+"?"+Orgvis.vars.apiCallInfo.rootPost.parameters+"&callback=?",
							type: "GET",
							dataType: "jsonp",
							async:true,
							cache:true,
							username:$.cookie('organogram-username'),
							password:$.cookie('organogram-password'),
	        				success:function(json){
	        					
	        					$("div#login p.login-message").slideUp(500);
	        					$("div#login p.login-success").slideDown(1000);
	        					
								// If successful login
								$.cookie("organogram-preview-mode", "true", { expires: 1 });
								
								Orgvis.vars.apiBase = "organogram.data.gov.uk";
								Orgvis.vars.previewMode = true;
								$("span#previewModeSign").show();
															
								// Display the breadcrumbs at the top of the vis
								Orgvis.loadRootPost(json);
								// Pass data to the regData function
								Orgvis.regData(json);
								Orgvis.vars.apiCallInfo.rootPost.complete = true;

								$("div#login p.login-message").slideUp(1000);
								$('div#login').dialog("close"); 
								Orgvis.initSpaceTree(false);
	        				},
	        				error:function(){
								$.cookie("organogram-preview-mode", null);
								$.cookie("organogram-username", null);
								$.cookie("organogram-password", null);	 
								       				
		        				$("div#login p.login-message").hide();
		        				$("div#login p.login-failed").slideDown(1000); 
		        				$('div#login input#password').val("");
		        				$('div#login input#username').focus();
		        				Orgvis.vars.apiCallInfo.rootPost = {};       					
	        				}
	        			});	     			
	        		} else {
	        			$("div#login p.login-message").hide();
	        			$("div#login p.login-failed").slideDown(1000);
	        		}		
	        	}
	    	},
	    	{
	        	text: "Cancel",
	        	click: function() { 
	        		Orgvis.vars.apiBase = "reference.data.gov.uk";
	        		Orgvis.vars.previewMode = false;
	        		$(this).dialog("close"); 
	        		Orgvis.initSpaceTree(false);
	        	}
	    	},
	    	{
	        	text: "Delete login history",
	        	click: function() { 
	        		$.cookie('organogram-username',null);
	        		$.cookie('organogram-password',null);
					$.cookie("organogram-preview-mode", null);
					$("div#login p.delHistory").slideDown(1000).slideUp(2000);
	        	}
	    	}], 
	    	modal: true, 
	    	position: 'center', 
	    	title: 'Preview mode', 
	    	resizable: false, 
	    	width: 500, 
	    	zIndex: 9999
	    });		
		
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
			duration: 300,
			fps:60,
			orientation: 'left',
			offsetX: Orgvis.vars.visOffsetX,  
			offsetY: Orgvis.vars.visOffsetY, 
			transition: $jit.Trans.Quad.easeIn, 
			levelDistance: 40,  
			levelsToShow: 1, 
			Node: {
				height:80,
				width: 170,
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
									label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">'+node.data.postIn[a].label[0]+'</span><span class="childLoader"><img src="../images/childLoader.gif" /></span>';
								} else {}
						}
					} else {
						label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">?</span>';
					}
					
					if(node.data.heldBy.length>1){
						label.innerHTML = label.innerHTML + '<span class="heldBy">'+node.data.heldBy.length+'</span>';
					}

				// If the post is a junior post						
				} else if(node.data.type == 'junior_posts'){
					$(label).addClass('juniorPost');
					$(label).addClass(node.data.nodeType);
											
					label.innerHTML = node.name;
					if(node.data.nodeType == 'JP_child'){
					
						var fteTotal = Math.round(node.data.fullTimeEquivalent*100)/100;
						
						label.innerHTML = label.innerHTML + '<span class="JP_grade">'+addCommas(node.data.grade.payband.salaryRange)+'</span>' + '<span class="heldBy" style="background-color:'+node.data.colour+';">'+fteTotal+'</span>';
					} else {
						label.innerHTML = label.innerHTML + '<span class="heldBy" style="background-color:'+node.data.colour+';">'+node.data.fteTotal+'</span>';			
						}
						
					//log(node.data.colour);
					$(label).css('color',node.data.colour);	
				}
				
				label.onclick = function(){ 										

						var m = {
						    offsetX: st.canvas.translateOffsetX+Orgvis.vars.visOffsetX,
						    offsetY: st.canvas.translateOffsetY,
						    enable: Orgvis.vars.autoalign
						};
														
						$("#infobox").fadeOut('fast');
							
						if(node.data.nodeType == "JP_none") {
							
						} else if(node.data.type != 'junior_posts'){	

							$("div.node").css("border","1px solid #AAAAAA");
							$("div#"+node.id).css("border","3px solid #333333");
															
							Orgvis.loadInfobox(node);
							
							var postID = node.data.uri.split("/");
							postID = postID[postID.length-1];	
							
							if(postID != Orgvis.vars.global_post && !node.data.childrenAdded && !node.data.onDemandInAction){
								Orgvis.notify("Loading","Loading children posts and junior staff for "+node.name+"...",false);
								node.data.onDemandInAction = true;
								$("div#"+node.id+" span.childLoader").show();
								Orgvis.getPostReportsOnDemand(node);
								Orgvis.getJuniorStaffOnDemand(node);
							}					
							
							st.onClick(node.id, { 
								Move: m
							});	
							
						} else {
							if(node.data.nodeType == "JP_child"){
								$("div.node").css("border","1px solid #AAAAAA");
								$("div#"+node.id).css("border","3px solid #333333");
								Orgvis.loadJuniorPostInfoBox(node);								
							} else {
								$("div.node").css("border","1px solid #AAAAAA");
								$("div#"+node.id).css("border","3px solid #333333");
								st.onClick(node.id, { 
									Move: m
								});									
							}
						}
										
				};  
				
				var style = label.style;
				style.width = 170 + 'px';
				style.height = 'auto';           
				style.cursor = 'pointer';
				//style.color = '#000000';
				style.fontSize = '0.8em';
				style.textAlign= 'center';
				style.textDecoration = 'none';
				style.paddingTop = '3px'; 	
		
				/*
				if($.browser.msie){
					//log("cornering");
					$(label).corner("3px");
				}	
				*/			
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
			//Orgvis.showLog("Loading data ...");
			Orgvis.notify("Loading","Calling API...",false);	
			log(Orgvis.vars.apiCallInfo);
			log(Orgvis.vars.apiResponses);
			Orgvis.getRootPostData();
			Orgvis.getReportsFullData();
			Orgvis.getJuniorStaffFullData();			
		} else if(!reload){	
			//Orgvis.showLog("Loading data ...");	
			Orgvis.notify("Loading","Calling API...",false);				
			Orgvis.getRootPostData();
			Orgvis.getReportsFullData();
			Orgvis.getJuniorStaffFullData();
		} else{
			//Orgvis.showLog("Reloading organogram ...");		
			Orgvis.notify("Loading","Reloading organogram data...",true);					
			Orgvis.reloadPost();
		}
	},
	getRootPostData:function() {

		Orgvis.vars.apiCallInfo.rootPost = {
			title:"Retrieval of root post information",
			description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
			url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post,
			parameters:"",
			complete:false
		};
		
		var s = {	
			url: Orgvis.vars.apiCallInfo.rootPost.url+".json"+"?"+Orgvis.vars.apiCallInfo.rootPost.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			error:function (e){
				log("API - rootPost - error");
				$.cookie("organogram-preview-mode", null);
				if(Orgvis.vars.previewMode){	
					Orgvis.showLogin();					
				}
				//Orgvis.changeLog("Error loading post's data", false);
				Orgvis.notify("Error","Could not retrieve the main post's data",true);
			},
			success: function(json){
				if(Orgvis.vars.previewParam){
					$("span#previewModeSign").show();
					$.cookie("organogram-preview-mode", true);
					Orgvis.vars.previewMode = true;
				}
				
				if(typeof json.result.primaryTopic.label != 'undefined'){
					// Display the breadcrumbs at the top of the vis
					Orgvis.loadRootPost(json);
					// Pass data to the regData function
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.rootPost.complete = true;		
				} else {
					//Orgvis.changeLog("Could not retrieve the main post's data",false);
					Orgvis.notify("Error","Could not retrieve the main post's data",true);
				}					
			}
		};

		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}
				
		$.myJSONP(s,"data",Orgvis.vars.postInQuestion)
	},
	getReportsFullData:function() {
		
		log("getting reports full data");
		
		Orgvis.vars.apiCallInfo.postReports = {
				title:"Retrieval of posts that report to the root post",
				description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post+"/reportsFull",
				parameters:"?_pageSize=300",
				complete:false
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.postReports.url+".json"+Orgvis.vars.apiCallInfo.postReports.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,				
				error: function(){
					log("API - postReports - error");
					//Orgvis.changeLog("Error loading post's organogram data", false);
					Orgvis.notify("Error","Could not load reporting posts", true);					
				},
				success: function(json){
					// Pass data to the regData function
					log("passing data to regData");
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.postReports.complete = true;
					Orgvis.notify("Success","Loaded reporting posts",false);
				}
			};
		
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			s.url = s.url.replace("reportsFull","reports-full");
		}
		
		$.myJSONP(s,"reporting posts' data",Orgvis.vars.postInQuestion);
				
			
	},
	getPostReportsOnDemand:function(node) {
		
		log("getPostReportsOnDemand");
		
		var postID = node.data.uri.split("/");
		postID= postID[postID.length-1];
		var originalChildren = Orgvis.vars.postList[postID].children.length;
		log("originalChildren: "+originalChildren);
								
		Orgvis.vars.apiCallInfo.postReportsOnDemand = {
				title:"Retrieval of posts that report to the clicked post",
				description:"This call retrieves information about the posts that report to the post that has been clicked within the organogram.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+postID+"/reportsFull",
				parameters:"?_pageSize=300",
				complete:false
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.postReportsOnDemand.url+".json"+Orgvis.vars.apiCallInfo.postReportsOnDemand.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,				
				error: function(){
					log("API - postReportsOnDemand - error");
					//Orgvis.changeLog("Error loading clicked post's reporting posts data", false);
					Orgvis.notify("Error","Could not load children posts for "+node.name, true);					
					// Stops another API call being made
					node.data.childrenAdded = true;
				    $("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
				},
				success: function(json){
					
					var postID = json.result._about.split("post/");
					postID = postID[1].split("/");
					postID = postID[0];
					log("getPostReportsOnDemand, success, postID: "+postID);
												
					// If the post ID has had an ondemand call already
					if(typeof Orgvis.vars.apiResponses["onDemand_"+postID] != 'undefined'){

						log('Orgvis.vars.apiResponses["onDemand_"+postID].length : '+Orgvis.vars.apiResponses["onDemand_"+postID].length);

						// If after adding this new response to the response var, then length 
						// is 2, then add the subtree. Otherwise do nothing.
						Orgvis.vars.apiResponses["onDemand_"+postID].postReportsOnDemand = json;
						
						// If the junior staff data has definitely been received, then it's
						// safe to build the whole structure
						if(typeof Orgvis.vars.apiResponses["onDemand_"+postID].juniorStaffOnDemand == "object"){
							
							
							// Build the reporting posts JSON structure
							// and connect to the clicked post by setting the JSON
							// structure's root post as the clicked post
							var options = {
								childrenAdded:true
							};
							
							Orgvis.buildPostList(json.result.items,options);
							Orgvis.connectPosts();
							Orgvis.connectJuniorPosts(json);
								
							log("adding subtree in getPostReportsOnDemand");
							Orgvis.vars.global_ST.addSubtree(Orgvis.vars.postList[postID], 'animate', {  
						        hideLabels: false,  
						        onAfterCompute: function() {  
						            log("Orgvis.vars.postList[postID].children.length: "+Orgvis.vars.postList[postID].children.length);
						            if(Orgvis.vars.postList[postID].children.length > originalChildren) {
						            	log("children added");
						            	$("div#"+node.id).css("background-color","#96FFA3");
						            	$("div#"+node.id).animate({ backgroundColor: "#E6FFEB" }, 5000);
								    	$("div#"+node.id+" span.childLoader img").attr("src","../images/childrenPresent.png");					       
								    } else {
								    	log("no children added");
								    	$("div#"+node.id).css("background-color","#FF9696");
								    	$("div#"+node.id).animate({ backgroundColor: "#FFE8E8" }, 5000);
						           		$("div#"+node.id+" span.childLoader img").attr("src","../images/noChildrenPresent.png");
								    }
								    log("onAfterCompute: addSubTree: getPostReportsOnDemand ");
								    Orgvis.vars.global_ST.refresh();
						            node.data.childrenAdded = true; 
						            node.data.onDemandInAction = false;
						        }
						    });
		
						    Orgvis.notify("Success","Loaded children and junior staff for "+node.name,false);						    
							Orgvis.vars.apiCallInfo.postReportsOnDemand.complete = true;
							
						}
					} else {
						Orgvis.vars.apiResponses["onDemand_"+postID] = {
							postReportsOnDemand:json,
							juniorStaffOnDemand:{}
						};
					}
				}
			};
		
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			s.url = s.url.replace("reportsFull","reports-full");
		}
		
		$.myJSONP(s,"children posts",node);
				
			
	},
	getJuniorStaffOnDemand:function(node) {
		
		log("getJuniorStaffOnDemand");
		
		var postID = node.data.uri.split("/");
		postID= postID[postID.length-1];
		var originalChildren = Orgvis.vars.postList[postID].children.length;
		log("originalChildren: "+originalChildren);
								
		Orgvis.vars.apiCallInfo.juniorStaffOnDemand = {
				title:"Retrieval of posts that report to the clicked post",
				description:"This call retrieves information about the posts that report to the post that has been clicked within the organogram.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+postID+"/junior-staff-full",
				parameters:"?_pageSize=300",
				complete:false
		};		

		var s = {
				url: Orgvis.vars.apiCallInfo.juniorStaffOnDemand.url+".json"+Orgvis.vars.apiCallInfo.juniorStaffOnDemand.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,				
				error: function(){
					log("API - juniorStaffOnDemand - error");
					//Orgvis.changeLog("Error loading clicked post's junior staff data", false);
					Orgvis.notify("Error","Could not load junior staff for "+node.name, true);					

					// Stops another API call being made
					node.data.juniorStaffAdded = true;
				    $("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
				},
				success: function(json){
					
					// If both API calls have been returned then
					var postID = json.result._about.split("post/");
					postID = postID[1].split("/");
					postID = postID[0];
					log("getJuniorStaffOnDemand, success, postID: "+postID);
												
					// If the post ID has had an ondemand call already
					if(typeof Orgvis.vars.apiResponses["onDemand_"+postID] != 'undefined'){
					
						log('Orgvis.vars.apiResponses["onDemand_"+postID].length : '+Orgvis.vars.apiResponses["onDemand_"+postID].length);
						
						// If after adding this new response to the response var, then length 
						// is 2, then add the subtree. Otherwise do nothing.
						Orgvis.vars.apiResponses["onDemand_"+postID].juniorStaffOnDemand = json;
						
						// If the reports to data has definitely been received, then it's
						// safe to build the whole structure including the junior posts
						if(typeof Orgvis.vars.apiResponses["onDemand_"+postID].postReportsOnDemand == "object"){
							// Build the reporting posts JSON structure
							// and connect to the clicked post by setting the JSON
							// structure's root post as the clicked post
							var options = {
								childrenAdded:true
							};
							
							Orgvis.buildPostList(json.result.items,options);
							Orgvis.connectPosts();
							Orgvis.connectJuniorPosts(json);					

							Orgvis.vars.global_ST.addSubtree(Orgvis.vars.postList[postID], 'animate', {  
						        hideLabels: false,  
						        onAfterCompute: function() {  
						            log("Orgvis.vars.postList[postID].children.length: "+Orgvis.vars.postList[postID].children.length);
						            if(Orgvis.vars.postList[postID].children.length > originalChildren) {
						            	log("children added");
						            	$("div#"+node.id).css("background-color","#96FFA3");
						            	$("div#"+node.id).animate({ backgroundColor: "#E6FFEB" }, 5000);
								    	$("div#"+node.id+" span.childLoader img").attr("src","../images/childrenPresent.png");					       
								    } else {
								    	log("no children added");
								    	$("div#"+node.id).css("background-color","#FF9696");
								    	$("div#"+node.id).animate({ backgroundColor: "#FFE8E8" }, 5000);
						           		$("div#"+node.id+" span.childLoader img").attr("src","../images/noChildrenPresent.png");
								    }
								    Orgvis.vars.global_ST.refresh();
						            node.data.childrenAdded = true; 
						            node.data.onDemandInAction = false;
						        }
						    });
		
						    Orgvis.notify("Success","Loaded children and junior staff for "+node.name,false);						    
							Orgvis.vars.apiCallInfo.juniorStaffOnDemand.complete = true;
							
						}
					} else {
						Orgvis.vars.apiResponses["onDemand_"+postID] = {
							juniorStaffOnDemand:json,
							postReportsOnDemand:{}
						};
					}
				}
			};
		
		
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
			s.url = s.url.replace("juniorStaffFull","junior-staff-full");
		}
		
		$.myJSONP(s,"junior staff",node);
				
			
	},	
	getJuniorStaffFullData:function() {
		
		log("getting junior reports data");
		
		Orgvis.vars.apiCallInfo.juniorStaff = {
				title:"Retrieval of all junior staff",
				description:"This call retrieves information about the junior staff that report to the posts within this organogram, such as their grade, title and profession.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post+"/junior-staff-full",
				parameters:"?_pageSize=300",
				complete:false
		};		

		var s = {
			url: Orgvis.vars.apiCallInfo.juniorStaff.url+".json"+Orgvis.vars.apiCallInfo.juniorStaff.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
		    error:function (){
		    	log("API - junior staff - error");
				//Orgvis.changeLog("Error loading junior staff data", false);
				Orgvis.notify("Error","Could not load junior staff",true);
			},
			success: function(json){
				// Pass data to the regData function
				log("passing data to regData");
				Orgvis.regData(json);
				Orgvis.notify("Success","Loaded junior staff",false);
				Orgvis.vars.apiCallInfo.juniorStaff.complete = true;							
			}
		};
			
		if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
			s.username = $.cookie('organogram-username');
			s.password = $.cookie('organogram-password');
		}	
		
		$.myJSONP(s,"junior staff",Orgvis.vars.postInQuestion);		
			
	},
	getStatsData:function(){
		
		// Collated for the API call info box
		Orgvis.vars.apiCallInfo.postStats = {
				title:"Retrieval of each post's statistics data",
				description:"An API call to retrieve the statistical data present for an individual post such as the salary cost of their junior staff.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post",
				parameters:"?_pageSize=300",
				complete:false
		};	
		
		// Make an API call for each post within the organogram
		$.each(Orgvis.vars.postList,function(k,v){
		
			var postID = v.data.uri.split("/");
			postID=postID[postID.length-1];
			
			var s = {
				url: Orgvis.vars.apiCallInfo.postStats.url+"/"+postID+"/statistics.json"+Orgvis.vars.apiCallInfo.postStats.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,
			    error:function (){
			    	log("API - stats data: "+v.name[0]+" - error");
					//Orgvis.changeLog("Error loading post: \""+v.name[0]+"\" statistics data", false);
					Orgvis.notify("Error","Could not load statistics data for \""+v.name[0]+"\"", true);
				},
				success: function(json){
					Orgvis.notify("Success","Loaded statistics data for \""+v.name[0]+"\"", true);
					v.data.stats = {
						salaryCostOfReports:{
							value:json.result.items[0].salaryCostOfReports
						},
						date:{
							value:json.result.items[0].date
						}
					};	
					v.data.stats.date.formatted = v.data.stats.date.value.split("/");
	                v.data.stats.date.formatted = '['+v.data.stats.date.formatted[v.data.stats.date.formatted.length-1]+']';
	                
	                if(typeof v.data.stats.salaryCostOfReports.value != 'undefined') {
	                	v.data.stats.salaryCostOfReports.formatted = '£'+addCommas(v.data.stats.salaryCostOfReports.value);
	                } else {
	                	v.data.stats.salaryCostOfReports.value = 'N/A';
	                	v.data.stats.salaryCostOfReports.formatted = 'N/A';
	                }
	                
	                if($("#infobox p.id span.value").html() == postID) {
						$('p.salaryReports').html('<span>Combined salary of reporting posts</span><span class="value">'+v.data.stats.salaryCostOfReports.formatted+'</span><a class="data" target="_blank" href="'+Orgvis.vars.apiCallInfo.postStats.url+'/'+postID+'/statistics" value="'+v.data.stats.salaryCostOfReports.value+'">Data</a><span class="date">'+v.data.stats.date.formatted+'</span>');	                
	                }           
					
				}
			};
				
			if(Orgvis.vars.previewMode || Orgvis.vars.previewParam){
				s.username = $.cookie('organogram-username');
				s.password = $.cookie('organogram-password');
			}
			
			$.myJSONP(s,'statistics data for "'+v.name[0]+'"');
		});
	},
	regData:function(data) {
		
		log("registering data");
		
		Orgvis.vars.apiResponses.push(data);
		log("Orgvis.vars.apiResponses:");
		log(Orgvis.vars.apiResponses);
		// If both API calls have been made then load the organogram
		if(Orgvis.vars.apiResponses.length == Orgvis.vars.firstLoad_expectedApiResponses){
		log("length is "+Orgvis.vars.firstLoad_expectedApiResponses);
			for(var i in Orgvis.vars.apiResponses){
				if(Orgvis.vars.previewMode){
					log('Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full"):');
					log(Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full"));
					
					if(Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full") > 0){
						log("found reports-full data");
						Orgvis.loadOrganogram(Orgvis.vars.apiResponses[i]);
					}
				} else {
					log('Orgvis.vars.apiResponses[i].result._about.indexOf("reportsFull"):');
					log(Orgvis.vars.apiResponses[i].result._about.indexOf("reportsFull"));
					
					if(Orgvis.vars.apiResponses[i].result._about.indexOf("reportsFull") > 0){
						log("found reportsFull data");
						Orgvis.loadOrganogram(Orgvis.vars.apiResponses[i]);
					}				
				}
			}
		} else {
			return;
		}
	},	
	loadRootPost:function(json){
	
		log("loading root post");
		
		var postTree;	
	
		$("#infovis-label").html("");
		$("#infobox").fadeOut();
					
		try {
			
			Orgvis.vars.postInQuestion = json.result.primaryTopic;
			//console.log("Post In Question:");
			//console.log(Orgvis.vars.postInQuestion);
			//Orgvis.vars.firstNode = makeNode(json.result.primaryTopic);
	
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
			var piqrtSlug = tempPostEl._about.toString().split("/");
			piqrtSlug = piqrtSlug[piqrtSlug.length-1];
			Orgvis.vars.postInQuestionReportsTo.push(piqrtSlug);
			
			if(typeof tempPostEl.reportsTo != 'undefined') {
				for(var a=0;a<tempPostEl.reportsTo.length;a++){
						
					piqrtSlug = tempPostEl.reportsTo[a]._about.toString().split("/");
					piqrtSlug = piqrtSlug[piqrtSlug.length-1];
					Orgvis.vars.postInQuestionReportsTo.push(piqrtSlug);
											
					if(typeof tempPostEl.reportsTo[a].reportsTo != 'undefined'){
						tempPostEl = tempPostEl.reportsTo[a];						
						a=a-1;
					} else {
					
					}
				}
			} else {}
					
		} catch(e){
			// No success when retrieving information about the root post
			log(e);
			//Orgvis.showLog("Error loading post data");
			Orgvis.notify("Error","Could not load post's data",true);
		}			
	},
	loadOrganogram:function(json) {
							
		log("loading organogram");
									
		// Search for the post in question
		for(var i=0;i<json.result.items.length;i++){
			if(Orgvis.vars.postInQuestion._about == json.result.items[i]._about){
				Orgvis.vars.postInQuestion = json.result.items[i];
			}
		}
		
		/*
		 * Establish the first node of the organogram 
		 * (the post that doesn't report to any other posts)
		 */
		if(typeof Orgvis.vars.postInQuestion.reportsTo != 'undefined') {
			for(var j=0;j<Orgvis.vars.postInQuestion.reportsTo.length;j++){
				if(typeof Orgvis.vars.postInQuestion.reportsTo[j].reportsTo != 'undefined' && Orgvis.vars.postInQuestion.reportsTo[j].label != 'undefined' && typeof Orgvis.vars.postInQuestion.reportsTo[j]._about != 'undefined'){
					Orgvis.vars.postInQuestion = Orgvis.vars.postInQuestion.reportsTo[j];
					j=j-1;
				} else if(typeof Orgvis.vars.postInQuestion.reportsTo[j]._about != 'undefined') {
					Orgvis.vars.firstNode = Orgvis.makeNode(Orgvis.vars.postInQuestion.reportsTo[j]);
				} else {
					Orgvis.vars.firstNode = Orgvis.makeNode(Orgvis.vars.postInQuestion);								
				}
			}
		} else {
			Orgvis.vars.firstNode = Orgvis.makeNode(Orgvis.vars.postInQuestion);						
		}
		
		log("Orgvis.vars.firstNode:");
		log(Orgvis.vars.firstNode);
		
		var options = {
			//childrenAdded:true,
			//firstBuild:true
		};
		Orgvis.buildPostList(json.result.items,options);
		
// Once post list has been built, fire off the API calls to 
// retrieve each post's statistics data
// Orgvis.getStatsData();
		
		for(var i in Orgvis.vars.apiResponses){			
			if(Orgvis.vars.apiResponses[i].result._about.indexOf("junior-staff-full") > 0){
				log("connectJuniorPosts: found junior-staff-full data");
				Orgvis.connectJuniorPosts(Orgvis.vars.apiResponses[i]);	
			}
		}
		
		Orgvis.vars.global_postJSON = Orgvis.connectPosts();
		Orgvis.setChildrenAdded(Orgvis.vars.postInQuestion);
		
		//groupSamePosts(Orgvis.vars.global_postJSON,false);
		
		/*
		// Add junior posts manually for demo purposes
		var names = ['Research Staff','Policy Advisor','Strategy Advisor','Administration Staff','Communications Assistant'];
		var grades = ['Grade 7: £35,000-£50,000','Grade 4: £65,000-£72,000','Grade 2: £75,000-£80,000','Grade 5: £45,000-£55,000','Grade 8: £30,000-£39,000'];
		var colours = ['#FFA4A4','#FFC48E','#A3FEBA','#FFFF84','#BBEBFF']; 
		           									
		Orgvis.addJuniorPosts(Orgvis.vars.global_postJSON, names, grades, colours);						
			//log("added junior posts:");
			//log(Orgvis.vars.global_postJSON);						
		var noJuniorPosts = {
			id:$.generateId(),
			name:"No Junior Posts",
			data:{
				total:0,
				nodeType:'JP_none',
				type:'junior_posts',
				colour:'#000000'
			},
			children:[]	            		
		};
		Orgvis.vars.global_postJSON.children.push(noJuniorPosts);
		*/
		
		// load json data
		Orgvis.vars.global_ST.loadJSON(Orgvis.vars.global_postJSON);
		// compute node positions and layout
		Orgvis.vars.global_ST.compute();
	
		Orgvis.vars.global_ST.onClick(Orgvis.vars.global_ST.root);
		
		//Orgvis.changeLog("Aligning node ...",true);
		Orgvis.notify("Info","Aligning node...",false);	

		
		var t = 0;
		var c = Orgvis.vars.postInQuestionReportsTo.length;
		//log("start c="+c);
		setTimeout(function(){	
			t = setInterval(function(){
				if(c == 1){
					if(!Orgvis.vars.global_ST.busy){
						clearInterval(t);
						Orgvis.vars.global_ST.onClick($("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1].toString()).attr("id"));
						$("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1].toString()).click();
						//Orgvis.hideLog(); 
						Orgvis.vars.ST_move = false;
						log("Orgvis.vars.ST_move:"+Orgvis.vars.ST_move);
						return false;
					}
					
				} else {
					if(!Orgvis.vars.global_ST.busy){
						Orgvis.vars.global_ST.onClick($("div.post_"+Orgvis.vars.postInQuestionReportsTo[c-1].toString()).attr("id"));
						c--;
					}
				}				
			},250);
		},500);	
		//end

		
		Orgvis.displayDataSources();

	},
	makeJuniorPostNode:function(){
		
		// The 'Junior Post' node parent for junior staff
		var node = {		
			id:$.generateId(),
			name:"Junior Posts",
			data:{
				total:0,
				fteTotal:0,
				nodeType:'JP_parent',
				type:'junior_posts',
				colour:'#FFFFFF'
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
				nodeType:'JP_none',
				type:'junior_posts',
				colour:'#000000'
			},
			children:[]	            		
		};	
		
		return node;
	},
	buildPostList:function(api_items, options){
				
		var fNodeID = Orgvis.vars.firstNode.data.uri.split("/");
		fNodeID = fNodeID[fNodeID.length-1];
		Orgvis.vars.postList[fNodeID] = Orgvis.vars.firstNode;
		// Push an empty Junior Posts node to the first node.
		// Orgvis.vars.postList[fNodeID].children.push(Orgvis.makeNoJuniorPostNode());
		
		// Build an associative array of posts using their post ID
		$.each(api_items, function (index, el) {
				try{
					var postID = el._about.split("/");
					postID = postID[postID.length-1];
					// If the key doesn't exist already
					if (!Orgvis.vars.postList[postID]) {
						// Create the key and give it a value
						Orgvis.vars.postList[postID] = Orgvis.makeNode(el);
						if(typeof options.childrenAdded != 'undefined'){
							Orgvis.vars.postList[postID].data.childrenAdded = options.childrenAdded;
						}
						// Assume all posts do not have any junior posts and
						// add an empty junior posts node to each post
						
						// Orgvis.vars.postList[postID].children.push(Orgvis.makeNoJuniorPostNode());
						
					} else {}
				}catch(e) {
					log(e);
				}
		});	
		
		log("postList:");
		log(Orgvis.vars.postList);	
	},	
	connectPosts:function(){
	
		var visJSON;

		$.each(Orgvis.vars.postList, function (index, el) {
			
			// Find the reportsTo values for each post
			if(typeof el.data.reportsTo != 'undefined' && el.data.reportsTo.length > 0) {
				var postID = el.data.reportsTo[0].split("/");
				postID = postID[postID.length-1];
				// Use the postID slug from the reportsTo value as a pointer in the associative array
				// to connect the post to it's parent. 
				if (Orgvis.vars.postList[postID]) {
  				Orgvis.vars.postList[postID].children.push(el);
				}
			} else {
				visJSON = el;
			}
			
		});
			
		//log("visJSON:")
		//log(visJSON);
	
		return visJSON;
	
	},
	connectJuniorPosts:function(json){
		
		var items = json.result.items;
		//log(items);
		
		// Loop through each of the junior post (JP)  items
		$.each(items, function (index, el) {
			
			// If a JP reports to a post
			if(typeof el.reportingTo != 'undefined') {
				log("connectJuniorPosts: found junior post");
				var postID = el.reportingTo._about.split("/");
				postID = postID[postID.length-1];
				log("postID: "+postID);
		
				// might not be a post to connect it to
				if (Orgvis.vars.postList[postID]) {
						log("Orgvis.vars.postList[postID].children.length:");
						log(Orgvis.vars.postList[postID].children.length);
											
						// Remove the empty junior staff node from the post that now has junior staff
						var postChildren = Orgvis.vars.postList[postID].children;
					
						for(var j in postChildren){
							if(postChildren[j].name == "No Junior Posts"){
								log("Removing node: "+postChildren[j].name);
								postChildren.splice(j,1);
							}
						}
		
						log("Orgvis.vars.postList[postID].children.length:");
						log(Orgvis.vars.postList[postID].children.length);						
					
						var addJPNode = true;
					
						for(var m in postChildren){
							log("searching postChildren fo JPNode:");
							log(postChildren[m]);
							if(postChildren[m].name == "Junior Posts"){
								log("Post already has Junior Post connected");
								addJPNode = false;
							}
						}
					
						if(addJPNode){
							// Add the 'Junior Posts' node to the post that holds the junior staff
							postChildren.push(Orgvis.makeJuniorPostNode());
							log("Added juniorPostsNode");
						}
					
						log("Orgvis.vars.postList[postID].children.length:");
						log(Orgvis.vars.postList[postID].children.length);
					
						log(postChildren);
					
						// Loop through the posts children
						for(var k in postChildren){
						
							log("postChildren[k].name:");
							log(postChildren[k].name);
						
							// If one of the posts's children is named "Junior Posts'
							if(postChildren[k].name == "Junior Posts"){
							
								log("Found the post's Junior Posts node:")
								log(postChildren[k]);
							
								// Add the actual junior staff item to the Junior Posts node
								postChildren[k].children.push(Orgvis.makeJuniorNode(el));
							
								log("el.fullTimeEquivalent:");
								log(el.fullTimeEquivalent);
							
								postChildren[k].data.fteTotal += el.fullTimeEquivalent;
							
								log("postChildren[k].data.fteTotal:");
								log(postChildren[k].data.fteTotal);
							
								log("Added a junior post");
								log(Orgvis.vars.postList[postID]);
							}
						
							postChildren[k].data.fteTotal = Math.round(postChildren[k].data.fteTotal*100)/100;
						}
					}
			}
		});	 // end each loop			

	},
	setChildrenAdded:function(node){
		// Find the post in the postList
		// traverse through all of it's newly added children
		// and set their "childrenAdded" flags to true.
		//postID = node.data.uri.split("/");
		//postID = postID[postID.length-1];
		
		log("setting childrenAdded for ");
		log(node);
		
		
			$.each(node, function(k,v){
				log('k');
				log(k);
				log('v');
				log(v);
				
				if(k == "data"){
					v.childrenAdded = true;
				}
				if(k == "children"){
					Orgvis.setChildrenAdded(v);
				}
				
			});

	},
	makeJuniorNode:function(el){
		
		log("makeJuniorNode: using item:");
		log(el);
		
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
		var node;
		
		try{
			node = {
				id:$.generateId(),
				name:el.withJob.prefLabel,
				data:{
					type:'junior_posts',
					nodeType:'JP_child',
					total:0,						// Used for grouping junior staff
					fullName:el.label[0],
					grade:{
						label:el.atGrade.prefLabel,
						payband:{
							label:el.atGrade.payband.prefLabel,
							salaryRange:el.atGrade.payband.salaryRange.label[0]
						}
					},
					job:el.withJob.prefLabel,
					profession:el.withProfession.prefLabel,
					reportingTo:{
						label:el.reportingTo.label[0],
						uri:el.reportingTo._about
					},
					unit:{
						label:el.inUnit.label[0],
						uri:el.inUnit._about
					},
					fullTimeEquivalent:el.fullTimeEquivalent,
					colour:Orgvis.vars.colours[Orgvis.vars.jpColourCounter]
				},
				children:[]
			};
		} catch(e) {
			log("makeJuniorNode error");
			log(e);
		}
		
		log('makeJuniorNode: node made:');
		log(node);
		
		if(Orgvis.vars.jpColourCounter == Orgvis.vars.colours.length){
			Orgvis.vars.jpColourCounter = 0;
		} else {
			Orgvis.vars.jpColourCounter++;		
		}
		
		Orgvis.vars.jpCounter++;
		
		return node;
	},
	addJuniorPosts:function(jsonObj, jNames, jGrades, jColours) {
    
    	//log(jColours);
       
	    if( typeof jsonObj == "object" ) {
	        $.each(jsonObj, function(k,v) {
	            // k is either an array index or object key
	            //log(k+':'+v);
	            if(typeof k == "number" && typeof v.id != 'undefined' && v.data.type != 'junior_posts'){
	            	// Add some junior post info to a post
	            	if(Orgvis.vars.JPcount<3){
		            	var juniorPosts = {
		            		id:$.generateId(),
		            		name:"Junior Posts",
		            		data:{
		            			total:0,
		            			nodeType:'JP_parent',
		            			type:'junior_posts',
		            			//colour:'#CBB3F8'
		            			colour:'#FFFFFF'
		            		},
		            		children:[]
		            	};
		            	
		            	
		            	var arr = ['0','1','2','3','4'];
		            	
		            	for(var i=0; i<arr.length; i++){
		            		var tot = Math.ceil(Math.random()*10);
		            		var tot2 = Math.floor(Math.random()*arr.length);
		            		//log(i+": adding "+tot+" junior posts - "+jNames[i]);
		            		juniorPosts.children.push(Orgvis.makeJuniorPost(jNames[arr[tot2]],tot,jGrades[arr[tot2]],jColours[arr[tot2]]));
		            		juniorPosts.data.total = juniorPosts.data.total+tot;
		            		arr.splice(tot2,1);
		            	}
		            	
		            	v.children.push(juniorPosts);         	
		            	Orgvis.vars.JPcount++;
	            	} else {
	            		var noJuniorPosts = {
		            		id:$.generateId(),
		            		name:"No Junior Posts",
		            		data:{
		            			total:0,
		            			nodeType:'JP_none',
		            			type:'junior_posts',
		            			colour:'#000000'
		            		},
		            		children:[]	            		
	            		};
	            		v.children.push(noJuniorPosts);
	            	}
	            }
	            
	            //if(Orgvis.vars.JPcount<3){ 
	            	Orgvis.addJuniorPosts(v,jNames,jGrades,jColours);
	            //} else {
	            	
	            //}
	        });
	    } else {
	        // jsonOb is a number or string
	   	}
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
	groupSamePosts:function(jsonObj,firstNodeFound) {
			
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
				
				return Orgvis.groupSamePosts(v,firstNodeFound); 
			});
		}		
	},
	makeNode:function(item) {

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
					salaryRange:item.salaryRange ? item.salaryRange.label : 'not disclosed',
					processed:false,
					childrenAdded:false
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
	},
	copyNode:function(node) {

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
					salaryRange:node.data.salaryRange,
					heldBy:[],
					processed:true
				},
				children:[]
		}
	
		return newNode;

	},
	loadInfobox:function(node){
		
		log("loadInfobox()");
		
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
			
			html+= '<p class="id"><span>Post ID</span><span class="value">'+tempID+'</span><a class="data postID" target="_blank" href="http://'+Orgvis.vars.apiBase+'/id/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'">Data</a><a class="data center_organogram" href="?'+Orgvis.vars.global_orgSlug+'='+Orgvis.vars.global_postOrg+'&post='+tempID+'">Center organogram</a></p>';
			
			html += '<p class="salary"><span>Salary</span><span class="value">'+node.data.salaryRange+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/id/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'">Data</a></p>';
			//'+addCommas(''+Math.floor(50000+(Math.random()*500000)))+'

			// If stats data has been retrieved then show data
			// otherwise show the loading sign
			
			var postObj = Orgvis.vars.postList[tempID];
						
			if(typeof postObj.data.stats != 'undefined') {
				html += '<p class="salaryReports"><span>Combined salary of reporting posts</span><span class="value">'+postObj.data.stats.salaryCostOfReports.formatted+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/id/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/post/'+tempID+'/statistics" value="'+postObj.data.stats.salaryCostOfReports.value+'">Data</a><span class="date">'+postObj.data.stats.date.formatted+'</span>';	
			} else {
				html += '<p class="salaryReports"><span>Combined salary of reporting posts </span><span class="value">Checking...</span><img class="salaryReports" width="14" height="14" src="../images/loading_white.gif"></p>';
			}				
			
			if(typeof node.data.heldBy[i].comment != 'undefined' && node.data.heldBy[i].comment.toString().length > 1){
				html+='<p class="comment"><span>Comment</span><span class="text">'+node.data.heldBy[i].comment+'</span></p>';
			}
	
			if(typeof node.data.heldBy[i].foafMbox != 'undefined' && node.data.heldBy[i].foafMbox != ''){
				html += '<p class="email"><span>Email</span><span class="value">'+node.data.heldBy[i].foafMbox+'</span></p>';
			}
			
			if(typeof node.data.heldBy[i].foafPhone != 'undefined' && node.data.heldBy[i].foafPhone != ''){
				html += '<p class="tel"><span>Phone</span><span class="value">'+node.data.heldBy[i].foafPhone+'</span></p>';
			}
		
			if(typeof node.data.type != 'undefined'){
				for(var a=0;a<node.data.type.length;a++){
					html += '<p class="type"><span>Type</span><span class="value">'+node.data.type[a]+'</span><a class="data center_organogram" href="../post-list?'+Orgvis.vars.global_orgSlug+'='+Orgvis.vars.global_postOrg+'&type='+node.data.type[a].replace(" ","+")+'">Post list</a></p>';
				}
			}
							
			if(typeof node.data.grade != 'undefined'){
				for(var a=0;a<node.data.grade.length;a++){
					html += '<p class="grade"><span>Grade</span><span class="value">'+node.data.grade[a]+'</span></p>';
				}
			}				
			
			html+= '<p class="unit"><span>Unit(s)</span><span class="value">'+tempUnitLabel+'</span><a class="data" target="_blank" href="http://'+Orgvis.vars.apiBase+'/id/'+Orgvis.vars.global_typeOfOrg+'/'+Orgvis.vars.global_postOrg+'/unit/'+tempUnitID+'">Data</a>';
	
			if(typeof node.data.heldBy[i].notes != 'undefined' && node.data.heldBy[i].notes.toString().length > 1){
				html+='<p class="notes"><span>Notes</span><span class="text">'+node.data.heldBy[i].notes+'</span></p>';
			}
					
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
		Orgvis.setInfoBoxLinks();
		$("#infobox").fadeIn();
		$("div.heldBy").show();
		
		if(Orgvis.vars.firstLoad){
			$("div.panel h3 a.infobox_"+Orgvis.vars.global_post).click(); 
			Orgvis.vars.firstLoad=false;
			Orgvis.vars.reOpen=false;
		} else {
			$("div.panel h3 a").eq(0).click();
			Orgvis.vars.reOpen=true;
		}
		
		//Orgvis.displaySalaryReports(node,postUnit);
			
	},
	loadJuniorPostInfoBox:function(node){

		// Construct the HTML for the infobox
		log("Building junior post infobox");
		log(node);
		var html = '<h1>'+node.name+'</h1>';
		html += '<div class="panel ui-accordion ui-widget ui-helper-reset ui-accordion-icons">';
		html += '<div class="content ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top">';
		
		html += '<p class="job"><span>Job</span><span class="value">'+node.data.job+'</span></p>';
		html += '<p class="profession"><span>Profession</span><span class="value">'+node.data.profession+'</span></p>';
		html += '<p class="fte"><span>Full Time Equivalent</span><span class="value">'+node.data.fullTimeEquivalent+'</span></p>';
		html += '<p class="grade"><span>Grade</span><span class="value">'+node.data.grade.label+'</span></p>';
		html += '<p class="payband"><span>Payband</span><span class="value">'+node.data.grade.payband.label+'</span></p>';
		html += '<p class="paybandRange"><span>Payband Salary Range</span><span class="value">'+addCommas(node.data.grade.payband.salaryRange)+'</span></p>';
		html += '<p class="reportsTo"><span>Reports To</span><span class="value">'+node.data.reportingTo.label+'</span></p>';
		html += '<p class="unit"><span>Unit</span><span class="value">'+node.data.unit.label+'</span></p>';
		
		html += '</div>'; // end content
		html += '</div>'; // end panel
		
		html += '<a class="close">x</a>';	
				
		$("#infobox").html(html);
		Orgvis.setInfoBoxLinks();
		$("#infobox").fadeIn();
		$("#infobox div.content").slideDown();	
				
		
	},
	displayDataSources:function() {
		
		// Need to use a foreach loop to identify the correct key's and values in the
		// new apiCallInfo object.
		
		log("displaying data sources");
		
		//$('div#apiCalls').fadeOut();
		
		var html='<p class="label">Data sources</p>';
		
		var i=0;

		$.each(Orgvis.vars.apiCallInfo,function(k,v){
			
			log(k);
			log(v);
			
			html += '<a class="source">'+(i+1)+'</a>';
			
			html += '<div class="apiCall shadowBox">';
			
			html += '<p class="title"><span>API call '+(i+1)+':</span>'+v.title+'</p>';
			html += '<p class="description"><span>Description:</span>'+v.description+'</p>';
			html += '<p class="url"><span>Endpoint URL:</span><a href="'+v.url+'.html">'+v.url+'</a></p>';	
	
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
		
		Orgvis.resetSourceLinks();
		
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
	showLog:function(string){
		/*
		$("#log img").show();
		$("#log span").html(string);
		$("#log").fadeIn();
		return false;
		*/
		
		$.jGrowl(string);
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
	},
	notify:function(type,message,stick) {
	
		$.jGrowl(message,{
			header:type,
			theme:type,
			sticky:stick,
			life:7000
		});

	}
}; // end Orgvis


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

// fn to handle jsonp with timeouts and errors
// hat tip to Ricardo Tomasi for the timeout logic
$.myJSONP = function(s,callName,n) {
	node = n || {name:"Unspecified"};
	
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

    	//Orgvis.showLog("Error requesting data for "+callName,false);
		Orgvis.notify("Error","Could not load "+node.name+"'s "+callName, true);
		$("div#"+node.id+" span.childLoader img").attr("src","../images/onDemandError.png");
		var json = {
				result:{
					_about:s.url,
					items:[]
				}
    		};
	    		    	
    	if(s.url.indexOf("junior-staff-full") > 0){    			
			Orgvis.vars.apiCallInfo.juniorStaff.complete = true;    		
    	}


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
	
	/*
	$( "div#Orgvis.vars.autoalign" ).buttonset().click(function(value){
		if(value.target.id == "on"){
			Orgvis.vars.autoalign = true;
		}else if(value.target.id == "off"){
			Orgvis.vars.autoalign = false;
			$('div#'+Orgvis.vars.global_ST.clickedNode.id);
		}
	});
	
	$('label[for=on]').click();
	*/
	
	// Navigation controls
	$(function() { 
	    $("button#nav_up").button({
	        icons: { primary: "ui-icon-circle-arrow-n" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetY = Orgvis.vars.global_ST.canvas.translateOffsetY + 10;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(0,10,false);
	    });    
	    $("button#nav_down").button({
	        icons: { primary: "ui-icon-circle-arrow-s" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetY = Orgvis.vars.global_ST.canvas.translateOffsetY - 10;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(0,-10,false);  
	    });  
	    $("button#nav_left").button({
	        icons: { primary: "ui-icon-circle-arrow-w" },
	      	text: false
	     }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetX = Orgvis.vars.global_ST.canvas.translateOffsetX + 10;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(10,0,false);		
	    });  
	    $("button#nav_right").button({
	        icons: { primary: "ui-icon-circle-arrow-e" },
	        text: false
	    }).mousehold(50,function() {
	        Orgvis.vars.global_ST.canvas.translateOffsetX = Orgvis.vars.global_ST.canvas.translateOffsetX - 10;
			Orgvis.vars.global_ST.canvas.canvases[0].translate(-10,0,false);	
	    });
	});
	
	/*
	$("#reload button#reset" ).button({
		icons: { primary: "ui-icon-refresh" },
	    text: false
	}).click(function(){
		Orgvis.vars.global_ST.canvas.clear();
		Orgvis.vars.global_ST.graph.clean();
		$('#infovis').html("");
		$('#infobox').html("").hide();	
		Orgvis.init(Orgvis.vars.global_department, Orgvis.vars.global_post,true);
	});
	*/
	
	$('div#right').children().css('visibility','visible');
	
	if($.browser.msie) {
		$("div#log").corner();
		$("div#right").corner("tl bl 10px");
	}

	$("div#right").show();
		
}); // end docready
