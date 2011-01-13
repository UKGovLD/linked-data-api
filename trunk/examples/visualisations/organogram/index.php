<?php
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>

<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link type="text/css" href="css/styles.css" rel="stylesheet">
<title>Organogram</title>

</head>

<body onload="init('<?php print $_GET['dept'];?>','<?php print $_GET['post'];?>');">

<h1 class="title"><span id="text">Organogram for :</span><span id="post">Post</span><span id="unit">Unit</span><span id="dept">Department</span></h1>

<div id="infovis"></div>

<div id="infobox">
	<a class="close">x</a>
</div>

<div id="right">
	
	<p><a class="return" href="../gov-structure">Return to the Government Overview</a></p>
	<ul>
		<li><a href="#">About</a>
		
		<div class="tip">
			<p><strong>About: </strong></p>
			<p>This is an organisational chart (organogram) visualisation for the structure of 'posts' within the UK government. Government departments are comprised of units which contain posts - these posts can be held by one or more persons.</p>
			
			<p>This visualisation shows the paths of responsibility in terms of who reports to who for the post in question by including it's 'parent' posts and it's 'children' posts. Clicking on a post in the visualisation should load it's children posts if there are any present.</p>
			
			<p>Each post has an information panel that includes information such as the name of the person(s) that holds the post, their contact details, the name of the departmental unit the post exists in, a description of the post's role and there are also links available that take you to the information itself - provided by the Linked Data API.</p>
			
			<p>To view the sources of data the visualisation uses at any time while using it, there's information provided about all of the the API calls made in the bottom right under "Data sources". Here you can grab the data in several different formats and see which parameters have been used to tailor the data for the visualisation.</p>
			
			<p>Please note: this web application is still under development.</p>
			
			<p>Created by Dan Paul Smith.</p>
		</div>
		</li>
		<!--li><a href="#">Controls</a>
		<div class="tip">
			<p><strong>Controls: </strong></p>

		</div>
		</li-->	
		<li id="orientation">
			<p>Orientation</p>
			<span><input type="radio" name="orientation" value="top"><label>Top</label></span>
			<span><input type="radio" name="orientation" value="left"><label>Left</label></span>
		</li>
	</ul>
	<div id="apiCalls">
		<p class="label">Data sources</p>
		<!-- information about API calls goes here -->
	</div>

</div>

<!--div id="log-wrapper"-->
<div id="log" style="border: 1px solid rgb(200, 200, 200);">
<span></span><img src="images/loading.gif" />
</div>
<!--/div-->

<!-- Scripts -->
<script language="javascript" type="text/javascript"
	src="js/jquery-1.4.2.min.js"></script>
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
