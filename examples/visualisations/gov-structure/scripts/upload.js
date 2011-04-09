$(document).ready(function(){

	$("div.step1").click(function(){
		$("div.preview").slideUp();
		$("div.download").slideUp();
		$("div.step2").removeClass("active");
		$("div.step3").removeClass("active");
		$("div.upload").slideDown();
		$(this).addClass("active");
	});
	
	$("div.step2").click(function(){
		$("div.upload").slideUp();
		$("div.download").slideUp();
		$("div.step1").removeClass("active");
		$("div.step3").removeClass("active");
		$("div.upload").slideDown();
		$(this).addClass("active");
	});

});