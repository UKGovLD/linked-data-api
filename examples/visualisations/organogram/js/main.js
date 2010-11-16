

$(document).ready(function() {

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
	
	$("h1.title span#text").click(function(){
		tm.out();tm.out();
	})
	
		
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
	
	if($('div#infobox p.comment').length != 0){
		$("a.comment").toggle(function(){
		$("div#infobox p.comment").slideDown();
	},function(){
		$("div#infobox p.comment").slideUp();	
	});	
	} else {
		$("a.comment").hide();
	}
	
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