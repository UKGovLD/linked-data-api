<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>

<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">

<link type="text/css" href="css/styles.css" rel="stylesheet">
<link type="text/css" href="css/prettyPhoto.css" rel="stylesheet"><!--link type="text/css" href="css/jquery.windows-engine.css" rel="stylesheet"-->

<title>Government Overview</title>

</head>

<body onload="init();">

<h1 class="title">Government Overview</h1>



<div id="infovis"></div>
<div id="infobox">
</div>
<!--div id="log-wrapper"-->
<div id="log" style="border: 1px solid rgb(200, 200, 200);"><span>Government Overview</span><img src="images/loading.gif" /></div>
<!--/div-->

<div id="right">
<ul>
<li><a href="#">Tips</a>

<div class="tooltip">
<p>Navigate your way down into the government structure by exploring departments, their units and the posts within those units.</p>
<p>As this is currently in development, when clicking on a post, most likely it will not follow through to the post-based organogram as only the top-tier of posts in units have been included in that visualisation. To experience the follow-through into a post-based organogram, delve into the BIS data and click on a Director General in any unit.</p>
</div>
</li>
<li><a href="#">Controls</a>
<div class="tooltip"><p>Left-click: Zoom in to department/unit</p><p>Right-click: Zoom out to the parent department/unit</p></div>
</li>

<li id="levelsToggle"><p>Levels to show:</p>
	<select id="levels" value="2">

	<option value="1">1</option>
	<option value="2">2</option>
	<option value="3">3</option>
	</select>
</li>

<!--li id="deputyToggle"><p>Include Deputy Directors?</p>
	<span><input type="radio" name="deputies" value="Yes"><label>Yes</label></span>
	<span><input type="radio" name="deputies" value="No" checked><label>No</label></span>
</li-->

</ul>

	<div id="apiCalls">
		<p class="label">Data sources</p>
		<!-- information about API calls goes here -->
	</div>

</div>



<!-- Scripts -->
<script language="javascript" type="text/javascript"
	src="js/jquery-1.4.2.min.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jit.js"></script>
<script language="javascript" type="text/javascript"
	src="js/overview.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.corner.js"></script>
	
<script language="javascript" type="text/javascript" src="js/main.js"></script>
<!--script language="javascript" type="text/javascript" src="js/JSONPrettyPrint.js"></script-->
<!--script language="javascript" type="text/javascript" src="js/jquery.windows-engine.js"></script-->

<!--[if IE]><script language="javascript" type="text/javascript" src="js/Jit/Extras/excanvas.js"></script><![endif]-->

</body>

</html>
