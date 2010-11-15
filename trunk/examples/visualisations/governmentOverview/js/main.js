

$(document).ready(function() {

	$("#infovis").width($(window).width()-100);
	$("#infovis").height($(window).height()-36);
	
	//$("#log").corner();
	
	$("div#right ul li").hover(function() {
		$(this).children().filter("div").show();
	},function() {
		$(this).children().filter("div").hide();		
	});
	
	//$("select#levels").val("2");
	//$("input[name='deputies']").val("No");
	
	$("select#levels").val("2");
	
	$("select#levels").change(function() {
		global_TM.canvas.opt.levelsToShow = parseInt($(this).val());
		//lvlsToShow = parseInt($(this).val());
		//global_TM.canvas.clear();
		//$("#infovis").html("");
		//global_TM.loadJSON(global_govJSON);  
		global_TM.refresh();
		global_TM.refresh();
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

/**
 * (C) 2007 Andrew Gwozdziewycz <apgwoz@gmail.com>
 * VERSION: 0.1, Released under an MIT License. 
 * URL: http://www.apgwoz.com/textfit/
 **/
function textFit(node, minfs, maxfs, width, height) {
    var fits = function(sz) {
        node.style.fontSize = sz + 'px';
        return node.offsetWidth <= width && node.offsetHeight <= height;
    };
    var hfs = maxfs - minfs;
    var tst = minfs + Math.ceil(hfs / 2);
    var opsz = node.style.fontSize;
    
    while ((hfs/2) >= 1) {
        if (fits(tst)) {
            minfs = tst;
        }
        else {
            maxfs = tst;
        }
        hfs = maxfs - minfs;
        tst = minfs + Math.ceil(hfs/2);
    }
    opsz = fits(maxfs) ? maxfs: minfs;
    node.style.fontSize = opsz + 'px';
}

(function ($) {
$.fn.vAlign = function() {
	return this.each(function(i){
	var h = $(this).height();
	var oh = $(this).outerHeight();
	var mt = (h + (oh - h)) / 2;	
	$(this).css("margin-top", "-" + mt + "px");	
	$(this).css("top", "50%");
	$(this).css("position", "absolute");	
	});	
};
})(jQuery);

(function ($) {
$.fn.hAlign = function() {
	return this.each(function(i){
	var w = $(this).width();
	var ow = $(this).outerWidth();	
	var ml = (w + (ow - w)) / 2;	
	$(this).css("margin-left", "-" + ml + "px");
	$(this).css("left", "50%");
	$(this).css("position", "absolute");
	});
};
})(jQuery);
