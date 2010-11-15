<?php
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>

<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">

<link type="text/css" href="css/styles.css" rel="stylesheet">
<link type="text/css" href="css/prettyPhoto.css" rel="stylesheet">

<title>Organogram</title>

</head>

<body onload="init('<?php print $_GET['dept'];?>','<?php print $_GET['post'];?>');">

<h1 class="title"><span id="text">Organogram for :</span><span id="post">Post</span><span id="unit">Unit</span><span id="dept">Department</span></h1>

<div id="infovis"></div>

<div id="infobox">
	<a class="close">x</a>
</div>

<div id="right">
	
	<p><a class="return" href="../governmentOverview">Return to the Government Overview</a></p>
	<ul>
		<li id="orientation">
			<p>Orientation</p>
			<span><input type="radio" name="orientation" value="top" checked><label>Top</label></span>
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
	src="js/jquery.simpletip-1.3.1.min.js"></script>
<script language="javascript" type="text/javascript"
	src="js/Jit/jit-yc.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.prettyPhoto.js"></script>
<script language="javascript" type="text/javascript"
	src="js/organogram.js"></script>
<script language="javascript" type="text/javascript" src="js/treemap.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.color.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.getUrlParam.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.corner.js"></script>
<script language="javascript" type="text/javascript" src="js/main.js"></script>
<!--[if lt IE 9]>
    <script src="js/json2.js"></script>
<![endif]-->

<!--[if IE]><script language="javascript" type="text/javascript" src="js/Jit/Extras/excanvas.js"></script><![endif]-->

</body>

</html>
