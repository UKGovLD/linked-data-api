

$(document).ready(function() {

	//window.resize = global_ST.canvas.resize($(window).width()-200, $(window).height()-200);
	
	//var numberOfSources = $("p#tab span").html();

	$("#infobox").hide();
	$("#infovis").width($(window).width()-110);
	$("#infovis").height($(window).height()-50);
	
	$("#log").corner();
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});
	
	
	$("input[name='orientation']").change(function(){
		if($(this).val() == "top") {
			global_ST.canvas.opt.orientation = "top";
			global_ST.refresh();
		} else if ($(this).val() == 'left') {
			global_ST.canvas.opt.orientation = "left";
			global_ST.refresh();
		}
	});
	
		
}); // end docready

function resetSourceLinks() {
	
	$("div#apiCalls a.source").click(function(){
		$("div#apiCalls div.apiCall").hide();
		$(this).next().fadeIn();
	});
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});
	
	//$("canvas").click(function(){
	//	$("#infobox").fadeOut();
	//	$("div#apiCalls div.apiCall").fadeOut();
	//});
	
	return false;
}

function tab(number) {
	$("ul#tabMenu li").eq(number-1).click();
}

// TOOLTIP
$(function() {

$("ul#tabMenu li").each(function() {
	$(this).simpletip({
		offset: [-5, 0],
		showTime:0,
		hideTime:0,
		content: $("div#"+$(this).html()+" ul li.type").html()
	});
}); 
	
});


function setInfoBoxLinks() {
	
	$("div.heldBy a.name").click(function() {
		//if this is expanded {
		//slideUp and change to +
		//} else {
		//slide all others up
		//change all others to +
		//slide this one down
		//change to -
		//}
		if($(this).next().css("display") == "block") {
			$(this).next().slideUp();
			$(this).children().filter("span").html("+");
		} else {
			$('div.heldBy div.personInfo').slideUp();
			$("div.heldBy a.name").each(function(){
				$(this).children().filter("span").html("+");
			});
			$(this).next().slideDown();
			$(this).children().filter("span").html("-");
		}
	});
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});
	

/*
	$("a#members").toggle(function() {
		$("ul.members").slideDown("slow");
		$("a#members").html("Members -");
		$("ul.salaryMap").slideUp("slow");
		$("a#salaryMap").html("Salary map +");	
		$("ul.members").scrollTop(0);
	},function() {
		$("ul.members").slideUp("slow");
		$("a#members").html("Members +");	
	});
	
	$("a#salaryMap").toggle(function() {
		$("ul.salaryMap").slideDown("slow");
		$("a#salaryMap").html("Salary map -");
		$("ul.members").slideUp("slow");
		$("a#members").html("Members +");			
	},function() {
		$("ul.salaryMap").slideUp("slow");
		$("a#salaryMap").html("Salary map +");	
	});
	
	$("ul.salaryMap").treemap(400,300,{getData:getDataFromUL, sort:true, headheight:10});
	
	var size = 0;
	var maxSize = 0;
	var factor = 0;
	
	$("div.treemapCell").each(function() {	
		size = $(this).height()*$(this).width();		
		if(size > maxSize) {
			factor = size/255;
			maxSize = $(this).height()*$(this).width();
		}				
	});	
		
	$("div.treemapCell").each(function() {			
		$(this).css("background-color",rgb2hex("rgb(20, "+parseInt((($(this).height()*$(this).width())/factor)).toString()+", 20)"));
	});

	$("ul.salaryMap").css("display","none").css("position","relative").css("visibility","visible");
	
	$("ul.members").scrollTop(0);
	
	if($("a#members").length != 0) {
		$("p#tab span").html("2");
		$("#source2").slideDown();
		
	} else {
		$("p#tab span").html("1");
		$("#source2").slideUp();
	}
	
	*/
	
	/*
	if($("p#tab span").html() != numberOfSources) {
		glowElement($("p#tab"),"#802323", "#FFFFFF");
		numberOfSources = $("p#tab span").html();
	}
	*/
	return false;
}


function getDataFromUL(el) {
 var data = [];
 jQuery("li",el).each(function(){
   var item = jQuery(this);
   var row = [item.find("span.name").html(),item.find("span.upperBoundSalary").html()];
   data.push(row);
 });
 return data;
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return parseInt(x).toString(16);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


var count = 0;
function glowElement(el,bg,text) {

	$(el).animate({backgroundColor:bg,color:text}, 500);
	
	if(count>3){
		clearTimeout(timeout);
		count = 0;
	}
	
	var timeout = setTimeout(function() {
						if(bg != "#FFFFFF") {
							if(count < 3) {
								glowElement(el,"#FFFFFF", "#000000");
							}
						}
						else {
							if(count<3) {
								glowElement(el,"#802323", "#FFFFFF");
							}
						}
						count++;
					},500);
					
	$(el).animate({backgroundColor:"#FFFFFF",color:"#000000"}, 0);
	
}