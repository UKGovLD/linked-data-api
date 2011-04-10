$(document).ready(function(){

	$("div.preview, div.download").hide();
	
	// Upload your data
	$("a.step1").click(function(){
		if(!$(this).hasClass("disabled")){
			$("div.preview, div.download").hide();
			$("a.step2, a.step3").removeClass("current");
			$("div.upload").fadeIn();
			$(this).addClass("current");
		} else {
			//console.log("step 1 is disabled");		
		}
	});
	
	// Preview your organogram
	$("a.step2").click(function(){
		if(!$(this).hasClass("disabled")){
			$("div.upload, div.download").hide();
			$("a.step1, a.step3").removeClass("current");
			$("div.preview").fadeIn();
			$(this).addClass("current");
		} else {
			//console.log("step 2 is disabled");		
		}	
	});
	
	// Download your data
	$("a.step3").click(function(){
		if(!$(this).hasClass("disabled")){
			$("div.upload, div.preview").hide();
			$("a.step1, a.step2").removeClass("current");
			$("div.download").fadeIn();
			$(this).addClass("current");
		} else {
			//console.log("step 3 is disabled");		
		}	
	});
	
	//$('input#upload').customFileInput();

});