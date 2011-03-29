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
		labelType:"", 			// var for theJIT
		useGradients:"",		// var for theJIT
		nativeTextSupport:"",	// var for theJIT
		animate:"",				// var for theJIT
		global_department:"",	// The department in questions ID
		global_post:"",			// The post in question's ID
		global_ST:"",			// Holds theJIT's SpaceTree instance
		global_postJSON:"",		// Holds the organogram data
		postInQuestion:{},		// The node object of the post in question (PIQ)
		postInQuestionReportsTo:[],	// An array of node objects the PIQ reports to
		firstNode:{},			// The first node object of the organogram
		firstLoad:true,			// Used for reloading the vis without retrieving the data again
		autoalign:true,			// automatically center the organogram onclick
		reOpen:false,			//
		visOffsetX:180,			// horizontal positioning
		visOffsetY:0,			// vertical positioning
		JPcount:0,				// Junior post count
	 	apiCallInfo: {			// Stores information about each API call to be made
			rootPost:{},		
			postReports:{},
			unitStats:{}
		},
		apiResponses:[],		// Stores JSON responses from the API
		cacheObj:{},			// An object to store API responses
		debug:true				// Output to console or not
	},
	init:function(deptSlug,postSlug,reload){
		
		Orgvis.vars.global_department = deptSlug;
		Orgvis.vars.global_post = postSlug;
		
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
					
				} else if(node.data.type == 'junior_posts'){
					
					$(label).addClass('juniorPost');
					$(label).addClass(node.data.nodeType);
											
					label.innerHTML = node.name;
					if(node.data.nodeType == 'JP_child'){label.innerHTML = label.innerHTML + '<span class="JP_grade">'+node.data.grade+'</span>';}
					label.innerHTML = label.innerHTML + '<span class="heldBy" style="background-color:'+node.data.colour+';">'+node.data.total+'</span>';				//log(node.data.colour);	
					$(label).css('color',node.data.colour);	
				}
				
				label.onclick = function(){ 
					if(node.data.nodeType != "JP_none" && node.data.nodeType != "JP_child") {
						var m = {
						    offsetX: st.canvas.translateOffsetX+Orgvis.vars.visOffsetX,
						    offsetY: st.canvas.translateOffsetY,
						    enable: Orgvis.vars.autoalign
						};
										
						st.onClick(node.id, { 
							Move: m
						});												
										
						$("div.node").css("border","1px solid #AAAAAA");
						$("div#"+node.id).css("border","3px solid #333333");		
		
						if($.browser.msie){
							//log("cornering");
							$("div#"+node.id).corner("3px")
						}
						
						$("#infobox").fadeOut('fast', function() {
							
							if(node.data.type != 'junior_posts'){
								Orgvis.loadPersonInfo(node);
							} else {
								//loadJuniorPostInfo(node);
							}
						});
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
	
		if(!reload){	
			Orgvis.showLog("Loading data ...");	
			Orgvis.getRootPostData();
			Orgvis.getPostReportsData();
		}else{
			Orgvis.reloadPost();
		}
	},
	getRootPostData:function() {

		Orgvis.vars.apiCallInfo.rootPost = {
			title:"Retrieval of root post information",
			description:"This call retrieves information about the root post in the organogram, such as their unit, grade and contact details.",
			url:"http://reference.data.gov.uk/doc/department/"+Orgvis.vars.global_department+"/post/"+Orgvis.vars.global_post,
			parameters:"",
			complete:false
		};	

		$.ajax({	
			url: Orgvis.vars.apiCallInfo.rootPost.url+".json"+"?"+Orgvis.vars.apiCallInfo.rootPost.parameters+"&callback=?",
			type: "GET",
			dataType: "jsonp",
			async:true,
			cache:true,
			error: function(){
				Orgvis.changeLog("Error loading post data", false);
			},
			success: function(json){
				// Display the breadcrumbs at the top of the vis
				Orgvis.loadRootPost(json);
				// Pass data to the regData function
				Orgvis.regData(json);
				Orgvis.vars.apiCallInfo.rootPost.complete = true;							
			}
		});
	},
	getPostReportsData:function() {
	
		Orgvis.vars.apiCallInfo.postReports = {
				title:"Retrieval of posts that report to the root post",
				description:"This call retrieves information about the posts that report to the root post, such as their unit, grade and contact details.",
				url:"http://reference.data.gov.uk/doc/department/"+Orgvis.vars.global_department+"/post/"+Orgvis.vars.global_post+"/reportsFull",
				parameters:"?_pageSize=300",
				complete:false
		};		

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
				Orgvis.regData(json);
				Orgvis.vars.apiCallInfo.postReports.complete = true;
			}
		});				
	},
	regData:function(data) {
		Orgvis.vars.apiResponses.push(data);
		// If both API calls have been made then load the organogram
		if(Orgvis.vars.apiResponses.length == 2){
			for(var i in Orgvis.vars.apiResponses){
				if(typeof Orgvis.vars.apiResponses[i].result.items != 'undefined'){
					Orgvis.loadOrganogram(Orgvis.vars.apiResponses[i]);
				}
			}
		} else {
			return;
		}
	},
	loadRootPost:function(json){
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
		
		Orgvis.vars.global_postJSON = Orgvis.connectPosts(json.result.items);
		
		//groupSamePosts(Orgvis.vars.global_postJSON,false);
		
		
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
	connectPosts:function(api_items){
	
		var postList = {};
		var visJSON;
		
		var fNodeID = Orgvis.vars.firstNode.data.uri.split("/");
		fNodeID = fNodeID[fNodeID.length-1];
		postList[fNodeID] = Orgvis.vars.firstNode;
		
		// Build an associative array of posts using their post ID
		$.each(api_items, function (index, el) {
				try{
					var postID = el._about.split("/");
					postID = postID[postID.length-1];
					// If the key doesn't exist already
					if (!postList[postID]) {
						// Create the key and give it a value
						postList[postID] = Orgvis.makeNode(el);
						
					} else {}
				}catch(e){
					log(e);
				}
		});	
		
		//log("postList:");
		//log(postList);
		
		$.each(postList, function (index, el) {
			
			if(typeof el.data.reportsTo != 'undefined' && el.data.reportsTo.length > 0) {
				var postID = el.data.reportsTo[0].split("/");
				postID = postID[postID.length-1];
				postList[postID].children.push(el);
			} else {
				visJSON = el;
			}
			
		});
			
		//log("visJSON:")
		//log(visJSON);
	
		return visJSON;
	
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
	makeJuniorPost:function(pname, pnumber, pgrade, pcolour){
	
		var node = {
			id:$.generateId(),
			name:pname,
			data:{
				type:'junior_posts',
				nodeType:'JP_child',
				total:pnumber,
				grade:pgrade,
				colour:pcolour
			},
			children:[]
		};
		
		//log('makeJuniorPost');
		//log(node);
		
		return node;
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
					heldBy:[],
					processed:true
				},
				children:[]
		}
	
		return newNode;

	},
	loadPersonInfo:function(node){
				
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
			
			html+= '<p class="id"><span>Post ID</span>'+tempID+'<a class="data center_organogram" href="?dept='+Orgvis.vars.global_department+'&post='+tempID+'">Center organogram</a><a class="data postID" target="_blank" href="http://reference.data.gov.uk/id/department/'+Orgvis.vars.global_department+'/post/'+tempID+'">Data</a></p>';
			
			html += '<p class="salary"><span>Salary</span>£'+addCommas(''+Math.floor(50000+(Math.random()*500000)))+'<a class="data" target="_blank" href="http://reference.data.gov.uk/id/department/'+Orgvis.vars.global_department+'/post/'+tempID+'">Data</a></p>';
	
			html += '<p class="salaryReports"><span>Combined salary of reporting posts </span>Checking...<img class="salaryReports" width="14" height="14" src="../images/loading_white.gif"></p>';
							
			if(typeof node.data.heldBy[i].comment != 'undefined' && node.data.heldBy[i].comment.toString().length > 1){
				html+='<p class="comment"><span>Comment</span><span class="text">'+node.data.heldBy[i].comment+'</span></p>';
			}
	
			if(typeof node.data.heldBy[i].foafMbox != 'undefined' && node.data.heldBy[i].foafMbox != ''){
				html += '<p class="email"><span>Email</span> '+node.data.heldBy[i].foafMbox+'</p>';
			}
			
			if(typeof node.data.heldBy[i].foafPhone != 'undefined' && node.data.heldBy[i].foafPhone != ''){
				html += '<p class="tel"><span>Phone</span>'+node.data.heldBy[i].foafPhone+'</p>';
			}
		
			if(typeof node.data.type != 'undefined'){
				for(var a=0;a<node.data.type.length;a++){
					html += '<p class="type"><span>Type</span>'+node.data.type[a]+'</p>';
				}
			}
							
			if(typeof node.data.grade != 'undefined'){
				for(var a=0;a<node.data.grade.length;a++){
					html += '<p class="grade"><span>Grade</span> <span class="g '+node.data.grade[a]+'">'+node.data.grade[a]+'</span></p>';
				}
			}				
			
			html+= '<p class="unit"><span>Unit(s)</span>';
			
			html+= tempUnitLabel+'<a class="data" target="_blank" href="http://reference.data.gov.uk/id/department/'+Orgvis.vars.global_department+'/unit/'+tempUnitID+'">Data</a>';
	
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
	displaySalaryReports:function(node,postUnit) {
	
		postUnit = postUnit.split("/");
		postUnit = postUnit[postUnit.length-1];
		var postLabel = node.name.toString().replace(/ /g,"+");
	
		// Make an API call to retrieve information about the root post
		var api_url = "http://reference.data.gov.uk/doc/department/"+Orgvis.vars.global_department+"/unit/"+postUnit+"/statistics";
		//var api_url = "http://danpaulsmith.com/puelia3/doc/department/"+Orgvis.vars.global_department+"/unit/"+postUnit+"/statistics";alert("Using danpaulsmith.com API");
	
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
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span>£'+addCommas(node.data.heldBy[v].salaryCostOfReports)+'<span class="date">'+node.data.heldBy[v].salaryCostOfReportsDate+'</span><a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics" value="'+node.data.heldBy[v].salaryCostOfReports+'">Data</a>');
										}
									});					
								} else {
									$("div.panel div.content").each(function(){
										if($(this).children("p.id").children("a.postID").attr("href") == node.data.heldBy[v].holdsPostURI) {
											$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span>N/A<a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics" value="'+node.data.heldBy[v].salaryCostOfReports+'">Data</a>');
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
								$(this).children("p.salaryReports").html('<span>Combined salary of reporting posts</span>N/A<a class="data" target="_blank" href="'+node.data.heldBy[v].holdsPostURI+'/statistics">Data</a>');
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
	        window.location = "../post-list?dept=co";
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
