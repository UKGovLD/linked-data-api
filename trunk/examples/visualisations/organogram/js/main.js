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
	        text: true
	    }).click(function() {
	        window.location = $(this).attr("rel");
	    });
	    $( "button#dept" ).button({
	        text: true
	    }).click(function() {
	        window.location = $(this).attr("rel");
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
	$( "div#navigate button#up" ).button().click(function(){});
	$( "div#navigate button#down" ).button();
	$( "div#navigate button#left" ).button();
	$( "div#navigate button#right" ).button();
	$( "div#orientation" ).buttonset().click(function(value){
		if(value.target.id == "top"){
			global_ST.canvas.opt.orientation = "top";
			global_ST.refresh();
		}else if(value.target.id == "left"){
			global_ST.canvas.opt.orientation = "left";
			global_ST.refresh();
		}
	});
	
	$('label[for=top]').click();
	
	$( "div#autoalign" ).buttonset().click(function(value){
		if(value.target.id == "on"){
			autoalign = true;
		}else if(value.target.id == "off"){
			autoalign = false;
			$('div#'+global_ST.clickedNode.id);
		}
	});
	
	$('label[for=on]').click();
	
	// Navigation controls
	$(function() {
	    $( "#navigate #up" ).button({
	        icons: { primary: "ui-icon-circle-arrow-n" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetY = global_ST.canvas.translateOffsetY + 10;
			global_ST.canvas.canvases[0].translate(0,10,false);
	    });    
	     $( "#navigate #down" ).button({
	        icons: { primary: "ui-icon-circle-arrow-s" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetY = global_ST.canvas.translateOffsetY - 10;
			global_ST.canvas.canvases[0].translate(0,-10,false);
	    });  
	     $( "#navigate #left" ).button({
	        icons: { primary: "ui-icon-circle-arrow-w" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetX = global_ST.canvas.translateOffsetX + 10;
			global_ST.canvas.canvases[0].translate(10,0,false);		
	    });  
	     $( "#navigate #right" ).button({
	        icons: { primary: "ui-icon-circle-arrow-e" },
	        text: false
	    }).mousehold(50,function() {
	        global_ST.canvas.translateOffsetX = global_ST.canvas.translateOffsetX - 10;
			global_ST.canvas.canvases[0].translate(-10,0,false);	
	    });    
	});
	
	$( "#reload button#reset" ).button({
		icons: { primary: "ui-icon-refresh" },
	    text: false
	}).click(function(){
		global_ST.canvas.clear();
		global_ST.graph.clean();
		$('#infovis').html("");
		$('#infobox').html("").hide();	
		init(global_department, global_post,true);
	});

	$('div#right').children().css('visibility','visible');
	
		
}); // end docready

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

function setInfoBoxLinks() {

	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});		
	
	$('div.heldBy').accordion({clearStyle:true, navigation:true, autoHeight:false, collapsible:true, active:true});
	
	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	$('div.panel h3').eq(0).click();

	return false;
}

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
