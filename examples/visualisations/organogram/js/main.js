

$(document).ready(function() {

	$("#infobox").hide();
	$("#infovis").width($(window).width()-110);
	$("#infovis").height($(window).height()-50);	
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});		

	$("div#right ul li").hover(function() {
		$(this).children().filter("div").show();
	},function() {
		$(this).children().filter("div").hide();		
	});
		
	$("input[name='orientation']").filter("[value='top']").attr("checked","checked");

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

	return false;
}

function setInfoBoxLinks() {
	
	$("div.heldBy div.expander a.name").click(function() {

		if($(this).next().css("display") == "block") {
			$(this).next().slideUp();
			$(this).children().filter("span").html("+");
		} else {
			$('div.heldBy div.content').slideUp();
			$("div.heldBy div.expander a.name").each(function(){
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