<?php
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link type="text/css" href="css/styles.css" rel="stylesheet">
<link type="text/css" href="css/custom-theme/jquery-ui-1.8.8.custom.css" rel="stylesheet">
<title>Organogram</title>
</head>

<body onload="init('<?php print $_GET['dept'];?>','<?php print $_GET['post'];?>',false);">

<h1 class="title breadcrumbs">
	<span id="text">Organogram</span><button id="post">Post</button><button id="unit">Unit</button><button id="dept">Department</button>
</h1>

<div id="infovis"></div>

<div id="infobox">
	<a class="close">x</a>
</div>

<div id="right">

		<!--a class="return" href="../gov-structure">Return to the Government Overview</a-->
		
		<a class="aboutToggle" href="#">About</a>
		
		<div class="about-tip tip">
			<p>This is an organisational chart (organogram) visualisation for the structure of 'posts' within the UK government. Government departments are comprised of units which contain posts and these posts can be held by one or more people.</p>
			
			<p>This visualisation shows the paths of responsibility in terms of who reports to who for the post in question by including it's 'parent' posts and it's 'children' posts. Clicking on a post in the visualisation should load it's children posts if there are any present.</p>
			
			<p>Each post has an information panel that includes information such as the name of the person(s) that holds the post, their contact details, the name of the departmental unit the post exists in, a description of the post's role and there are also links available that take you to the information itself - provided by the Linked Data API.</p>
			
			<p>To view the sources of data the visualisation uses at any time while using it, there's information provided about all of the the API calls made in the bottom right under "Data sources". Here you can grab the data in several different formats and see which parameters have been used to tailor the data for the visualisation.</p>

			<p><strong>Controls: </strong></p>
			<ul>
				<li>Adjust: click and hold the organogram to drag it around.</li>
				<li>Zoom: while hovering over the organogram, scroll up/down using a mousewheel or trackpad to zoom in/out.</li>
				<li>Alternatively, you can use the buttons provided on right hand side.</li>
			</ul>
						
			<p>Please note: this application is still under development.</p>
						
			<p><i>Powered by <a href="http://code.google.com/p/puelia-php/" target="_blank">Puelia v0.1</a>, an implementation of the <a href="http://code.google.com/p/linked-data-api" target="_blank">Linked Data API</a></i></p>
						
		</div>
		
		<div class="orientation">
		<p>Orientation</p>
			<form>
				<div id="orientation">
					<input type="radio" id="top" name="orientation" checked="checked" /><label for="top">Top</label>
					<input type="radio" id="left" name="orientation" /><label for="left">Left</label>
				</div>
			</form>
		</div>

		<div class="autoalign">
		<p>Auto-adjust</p>
			<form>
				<div id="autoalign">
					<input type="radio" id="on" name="autoalign" checked="checked" /><label for="on">On</label>
					<input type="radio" id="off" name="autoalign" /><label for="off">Off</label>
				</div>
			</form>
		</div>	
		
		<div class="navigate">
			<p>Adjust</p>
            <div id="navigate">
                <button id="up">Up</button>
                <button id="down">Down</button>
                <button id="left">Left</button>
                <button id="right">Right</button>
            </div>
		</div>
		
		<!--div class="reload">
			<p>Reset</p>
            <div id="reload">
                <button id="reset">Reset</button>
            </div>
		</div-->		
		
				
	<div id="apiCalls">
		<p class="label">Data sources</p>
		<!-- information about API calls goes here -->
	</div>

</div>

<!--div id="log-wrapper"-->
<div id="log" style="border: 1px solid rgb(200, 200, 200);">
	<span></span>
	<img src="images/loading.gif" />
</div>
<!--/div-->

<!-- Scripts -->
<script language="javascript" type="text/javascript"
	src="js/jquery-1.4.4.min.js"></script>
<!--script language="javascript" type="text/javascript"
	src="js/jquery-ui-1.8.8.custom.min.js"></script-->	
<script language="javascript" type="text/javascript"
	src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.7/jquery-ui.min.js"></script>	
	
<script language="javascript" type="text/javascript"
	src="js/Jit/jit-yc.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.tinysort.min.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.ajaxmanager.js"></script>		
<script language="javascript" type="text/javascript"
	src="js/organogram.js"></script>
<script language="javascript" type="text/javascript" src="js/main.js"></script>

<!--[if lt IE 9]>
    <script src="js/json2.js"></script>
<![endif]-->

<!--[if IE]><script language="javascript" type="text/javascript" src="js/Jit/Extras/excanvas.js"></script><![endif]-->

</body>

</html>
