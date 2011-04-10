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
			'#8FFEDD', 			// cyan
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
	 	apiCallInfo: {			// Stores information about each API call to be made
			rootPost:{},		
			postReports:{},
			juniorStaff:{},
			unitStats:{}
		},
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
			showLog("No post selected!");
		} else{
			Orgvis.vars.global_post = postSlug;		
		}
			
		// Check for preview parameter
		if(pMode){
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
			$("h1.title span#previewModeSign").show();
			Orgvis.initSpaceTree(reload);

		} // Check for user & pass in cookie
		/*
		else if($.cookie("organogram-preview-mode") == "true") {
			// In preview mode
			Orgvis.vars.previewMode = pMode;
			Orgvis.vars.apiBase = "organogram.data.gov.uk";
			$("h1.title span#previewModeSign").show();		
		} 
		*/
		else {
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
								$("h1.title span#previewModeSign").show();
															
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
									label.innerHTML = label.innerHTML + '<span class="postIn ui-state-active">'+node.data.postIn[a].label[0]+'</span>';
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
						label.innerHTML = label.innerHTML + '<span class="JP_grade">'+addCommas(node.data.grade.payband.salaryRange)+'</span>' + '<span class="heldBy" style="background-color:'+node.data.colour+';">'+node.data.fullTimeEquivalent+'</span>';
					} else {
						label.innerHTML = label.innerHTML + '<span class="heldBy" style="background-color:'+node.data.colour+';">'+node.data.fteTotal+'</span>';			}
						
					//log(node.data.colour);
					$(label).css('color',node.data.colour);	
				}
				
				label.onclick = function(){ 										
										
						$("div.node").css("border","1px solid #AAAAAA");
						$("div#"+node.id).css("border","3px solid #333333");		

						var m = {
						    offsetX: st.canvas.translateOffsetX+Orgvis.vars.visOffsetX,
						    offsetY: st.canvas.translateOffsetY,
						    enable: Orgvis.vars.autoalign
						};
														
						$("#infobox").fadeOut('fast', function() {
							
							if(node.data.type != 'junior_posts'){								
								st.onClick(node.id, { 
									Move: m
								});		
								Orgvis.loadInfobox(node);
							} else {
								if(node.data.nodeType == "JP_child"){
									Orgvis.loadJuniorPostInfoBox(node);								
								} else {
									st.onClick(node.id, { 
										Move: m
									});									
								}
							}
						});				
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
			log(Orgvis.vars.apiCallInfo);
			log(Orgvis.vars.apiResponses);
			Orgvis.getReportsFullData();
			Orgvis.getJuniorStaffFullData();			
		} else if(!reload){	
			Orgvis.showLog("Loading data ...");	
			Orgvis.getRootPostData();
			Orgvis.getReportsFullData();
			Orgvis.getJuniorStaffFullData();
		} else{
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

		$.ajax({	
			url: Orgvis.vars.apiCallInfo.rootPost.url+".json"+"?"+Orgvis.vars.apiCallInfo.rootPost.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			cache:true,
			error:function (xhr, ajaxOptions, thrownError){
				log("xhr.status:");				
				log(xhr.status);
				log(ajaxOptions);
				log(thrownError);
				
				if(Orgvis.vars.previewMode){
					Orgvis.changeLog("Error loading post data", false);
					Orgvis.showLogin();					
				}else{
					Orgvis.changeLog("Error loading post data", false);
				}
			},
			success: function(json){
				Orgvis.vars.previewMode = true;			
				// Display the breadcrumbs at the top of the vis
				Orgvis.loadRootPost(json);
				// Pass data to the regData function
				Orgvis.regData(json);
				Orgvis.vars.apiCallInfo.rootPost.complete = true;							
			}
		});
	},
	getReportsFullData:function() {
		
		log("getting reports full data");
		
		Orgvis.vars.apiCallInfo.postReports = {
				title:"Retrieval of posts that report to the root post",
				description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
				url:"http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/post/"+Orgvis.vars.global_post+"/reports-full",
				parameters:"?_pageSize=300",
				complete:false
		};		


		if(Orgvis.vars.previewMode){
			$.ajax({
				url: Orgvis.vars.apiCallInfo.postReports.url+".json"+Orgvis.vars.apiCallInfo.postReports.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,
				cache:true,
				username:$.cookie('organogram-username'),
				password:$.cookie('organogram-password'),				
				error: function(){
					Orgvis.changeLog("Error loading organogram data", false);
				},
				success: function(json){
					// Pass data to the regData function
					log("passing data to regData");
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.postReports.complete = true;
				}
			});						
		} else {
			$.ajax({
				url: Orgvis.vars.apiCallInfo.postReports.url+".json"+Orgvis.vars.apiCallInfo.postReports.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,
				cache:true,
				error: function(){
					Orgvis.changeLog("Error loading organogram data", false);
				},
				success: function(json){
					// Pass data to the regData function
					log("passing data to regData");
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.postReports.complete = true;
				}
			});			
		}
		
			
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


		if(Orgvis.vars.previewMode){
			$.ajax({
				url: Orgvis.vars.apiCallInfo.juniorStaff.url+".json"+Orgvis.vars.apiCallInfo.juniorStaff.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,
				cache:true,
				username:$.cookie('organogram-username'),
				password:$.cookie('organogram-password'),				
				error: function(){
					Orgvis.changeLog("Error loading organogram data", false);
				},
				success: function(json){
					// Pass data to the regData function
					log("passing data to regData");
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.juniorStaff.complete = true;							
				}
			});						
		} else {
			$.ajax({
				url: Orgvis.vars.apiCallInfo.juniorStaff.url+".json"+Orgvis.vars.apiCallInfo.juniorStaff.parameters+"&callback=?",
				type: "GET",
				dataType: "jsonp",
				async:true,
				cache:true,
				error: function(){
					Orgvis.changeLog("Error loading organogram data", false);
				},
				success: function(json){
					// Pass data to the regData function
					log("passing data to regData");
					Orgvis.regData(json);
					Orgvis.vars.apiCallInfo.juniorStaff.complete = true;							
				}
			});			
		}
		
			
	},
	regData:function(data) {
		
		log("registering data");
		
		Orgvis.vars.apiResponses.push(data);
		log("Orgvis.vars.apiResponses:");
		log(Orgvis.vars.apiResponses);
		// If both API calls have been made then load the organogram
		if(Orgvis.vars.apiResponses.length == 3){
		log("length is 3");
			for(var i in Orgvis.vars.apiResponses){
				log('Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full"):');
				log(Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full"));
				
				if(Orgvis.vars.apiResponses[i].result._about.indexOf("reports-full") > 0){
					log("found reports-full data");
					Orgvis.loadOrganogram(Orgvis.vars.apiResponses[i]);
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
			//cl(Orgvis.vars.firstNode);
			
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
			cl(e);
			Orgvis.showLog("Error loading post data");
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

		Orgvis.buildPostList(json.result.items);
		Orgvis.connectJuniorPosts();
		Orgvis.vars.global_postJSON = Orgvis.connectPosts();
		
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
		
		Orgvis.changeLog("Aligning node ...",true);
		
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
						Orgvis.hideLog(); 
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
	buildPostList:function(api_items){
				
		var fNodeID = Orgvis.vars.firstNode.data.uri.split("/");
		fNodeID = fNodeID[fNodeID.length-1];
		Orgvis.vars.postList[fNodeID] = Orgvis.vars.firstNode;
		// Push an empty Junior Posts node to the first node.
		Orgvis.vars.postList[fNodeID].children.push(Orgvis.makeNoJuniorPostNode());
		
		// Build an associative array of posts using their post ID
		$.each(api_items, function (index, el) {
				try{
					var postID = el._about.split("/");
					postID = postID[postID.length-1];
					// If the key doesn't exist already
					if (!Orgvis.vars.postList[postID]) {
						// Create the key and give it a value
						Orgvis.vars.postList[postID] = Orgvis.makeNode(el);
						// Assume all posts do not have any junior posts and
						// add an empty junior posts node to each post
						Orgvis.vars.postList[postID].children.push(Orgvis.makeNoJuniorPostNode());
					} else {}
				}catch(e) {
					log(e);
				}
		});	
		
		log("postList:");
		log(Orgvis.vars.postList);	
	},	
	connectJuniorPosts:function(){
	
		for(var i in Orgvis.vars.apiResponses){			
			if(Orgvis.vars.apiResponses[i].result._about.indexOf("junior-staff-full") > 0){
				log("connectJuniorPosts: found junior-staff-full data");
				
				var items = Orgvis.vars.apiResponses[i].result.items;
				log(items);
				
				// Loop through each of the junior post (JP)  items
				$.each(items, function (index, el) {
					
					// If a JP reports to a post
					if(typeof el.reportingTo != 'undefined') {
						log("connectJuniorPosts: found junior post");
						var postID = el.reportingTo._about.split("/");
						postID = postID[postID.length-1];
						log("postID: "+postID);

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
						}
					}
				});	 // end each loop			
			} 
		}
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
				Orgvis.vars.postList[postID].children.push(el);
			} else {
				visJSON = el;
			}
			
		});
			
		//log("visJSON:")
		//log(visJSON);
	
		return visJSON;
	
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
					salaryRange:item.salaryRange.label,
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
			
			html += '<p class="salaryReports"><span>Combined salary of reporting posts </span><span class="value">Checking...</span><img class="salaryReports" width="14" height="14" src="../images/loading_white.gif"></p>';
							
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
		
		Orgvis.displaySalaryReports(node,postUnit);
			
	},
	loadJuniorPostInfoBox:function(node){
		/*
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
		*/

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
	displaySalaryReports:function(node,postUnit) {
	
		postUnit = postUnit.split("/");
		postUnit = postUnit[postUnit.length-1];
		var postLabel = node.name.toString().replace(/ /g,"+");
	
		// Make an API call to retrieve information about the root post
		var api_url = "http://"+Orgvis.vars.apiBase+"/doc/"+Orgvis.vars.global_typeOfOrg+"/"+Orgvis.vars.global_postOrg+"/unit/"+postUnit+"/statistics";
	
		// Call API for post statistics	
		postLabel = postLabel.replace("&","%26");
		
		$.ajax({
			url:api_url+".json?_pageSize=300&aboutPost.label="+postLabel+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			cache:true,
			error: function(){
				Orgvis.changeLog("Error loading salary data", false);
			},		
			success: function(json){
			
				// Put this code into a function
				
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
										if($(this).children("p.id").children("a.postID").attr("href") == node.data.heldBy[v].holdsPostURI.toString()) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><span class="value">£'+addCommas(node.data.heldBy[v].salaryCostOfReports)+'</span><a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics" value="'+node.data.heldBy[v].salaryCostOfReports+'">Data</a><span class="date">'+node.data.heldBy[v].salaryCostOfReportsDate+'</span>');
										}
									});					
								} else {
									$("div.panel div.content").each(function(){
										if($(this).children("p.id").children("a.postID").attr("href") == node.data.heldBy[v].holdsPostURI) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><span class="value">N/A</span><a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics" value="'+node.data.heldBy[v].salaryCostOfReports+'">Data</a>');
										}
									});								
								} // end else									
							} // end if
						} // end for
					} // end for

					
					// Description of API call
					//for(var x=0;x<Orgvis.vars.apiCallInfo.length;x++){
					//	if(Orgvis.vars.apiCallInfo[x].title == "Retrieval of post's statistics data"){
					//		Orgvis.vars.apiCallInfo.splice(x,1);
					//	}
					//}
					
					Orgvis.vars.apiCallInfo.unitStats = {
						title:"Retrieval of post's statistics data",
						description:"Retrieves stasitics such as the total salary figure for posts, specifically reporting to: \""+node.name+"\"",
						url:api_url,
						parameters:'?_pageSize=300&aboutPost.label='+postLabel,
						complete:false
					};			
							
					Orgvis.displayDataSources();
								
				} else {
					// Unit has no stats data
				
					//for(var y=0;y<Orgvis.vars.apiCallInfo.length;y++){
					//	if(Orgvis.vars.apiCallInfo[y].title == "Retrieval of post's statistics data"){
					//		Orgvis.vars.apiCallInfo.splice(y,1);
					//	}
					//}			
					for(var v=0;v<node.data.heldBy.length; v++) {					
						$("div.expander div.content").each(function(){
							if($(this).children("p.id").children("a.postID").attr("href") == node.data.heldBy[v].holdsPostURI) {
								$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span><span class="value">N/A</span><a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">Data</a>');
							}
						});	
					}
				}
				
			} // end success
		}); // end ajax call
			
		return false;
	},
	displayDataSources:function() {
		
		// Need to use a foreach loop to identify the correct key's and values in the
		// new apiCallInfo object.
		
		/*
		$('div#apiCalls').fadeOut();
		
		var html='<p class="label">Data sources</p>';
		
		for(var i=0;i<Orgvis.vars.apiCallInfo.length;i++){
			
			html += '<a class="source">'+(i+1)+'</a>';
			
			html += '<div class="apiCall shadowBox">';
			
			html += '<p class="title"><span>API call '+(i+1)+':</span>'+Orgvis.vars.apiCallInfo[i].title+'</p>';
			html += '<p class="description"><span>Description:</span>'+Orgvis.vars.apiCallInfo[i].description+'</p>';
			html += '<p class="url"><span>Endpoint URL:</span><a href="'+Orgvis.vars.apiCallInfo[i].url+'.html">'+Orgvis.vars.apiCallInfo[i].url+'.html</a></p>';	
	
			if(Orgvis.vars.apiCallInfo[i].parameters != ""){
				html += '<p class="params"><span>Parameters:</span></p>';
				
				var tempParams = Orgvis.vars.apiCallInfo[i].parameters.replace("?","").split("&");
						
				html += '<ul class="paramlist">';
				for(var j=0;j<tempParams.length;j++){
					html+= '<li>'+tempParams[j]+'</li>';
				}
				html += '</ul>';
			}
			
			html += '<p class="formats"><span>Formats:</span>';
			html += '<a href="'+Orgvis.vars.apiCallInfo[i].url+'.rdf'+Orgvis.vars.apiCallInfo[i].parameters+'" target="_blank">RDF</a>';
			html += '<a href="'+Orgvis.vars.apiCallInfo[i].url+'.ttl'+Orgvis.vars.apiCallInfo[i].parameters+'" target="_blank">TTL</a>';
			html += '<a href="'+Orgvis.vars.apiCallInfo[i].url+'.xml'+Orgvis.vars.apiCallInfo[i].parameters+'" target="_blank">XML</a>';
			html += '<a href="'+Orgvis.vars.apiCallInfo[i].url+'.json'+Orgvis.vars.apiCallInfo[i].parameters+'" target="_blank">JSON</a>';
			html += '<a href="'+Orgvis.vars.apiCallInfo[i].url+'.html'+Orgvis.vars.apiCallInfo[i].parameters+'" target="_blank">HTML</a>';
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
			
		*/
		
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
		$("#log img").show();
		$("#log span").html(string);
		$("#log").fadeIn();
		return false;
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
	}
} // end Orgvis


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


function cl(obj) {
	if(Orgvis.vars.debug){
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
	        window.location = "../post-list?"+Orgvis.vars.global_orgSlug+"="+Orgvis.vars.global_postOrg;
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
