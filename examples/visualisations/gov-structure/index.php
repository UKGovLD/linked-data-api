<?php ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>

<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">

<link type="text/css" href="css/styles.css" rel="stylesheet">

<title>Government Overview</title>

</head>

<body onload="init('<?php print $_GET['dept'];?>','<?php print $_GET['unit'];?>');">

<h1 class="title"><span id="text" rel="government">HM Government</span><span id="dept">Department</span><span id="unit">Unit</span></h1>

<div id="infovis"></div>
<div id="infobox">
</div>
<!--div id="log-wrapper"-->
<div id="log" style="border: 1px solid rgb(200, 200, 200);"><span>Government Overview</span><img src="images/loading.gif" /></div>
<!--/div-->

<div id="right">
<ul>
<li><a href="#">About</a>

<div class="tip">
	<p><strong>About: </strong></p>
	
	<p>This is a "treemap" visualisation of the UK Government's departmental structure - using data provided by data.gov.uk. (Note: as more data is uploaded and made available, this visualisation will change automatically as it accesses data in real-time).</p>
	
	<p>The visualisation lets you drill down from the top-level of the government structure (departments), into their units and finally through to the lowest-level (posts).</p>
	
	<p>When clicking on a post, an &quot;organogram&quot; visualisation will load, where you can see more information about who reports to who, their responsibilities and statistics such as salary totals.</p>
	
	<p>At any point, the raw data can be accessed by clicking on the "Data Sources" links in the bottom-right corner. Each data source link contains information about what data has been accessed, how it has been accessed and where you can get it yourself - it's open data after all!</p>
	
	<p>Updates to follow such as  features to come (including more types of data to link to as it uses Linked Data).</p>
	
	<p>Created by Dan Paul Smith.</p>
</div>
</li>
<li><a href="#">Controls</a>
<div class="tip">
	<p><strong>Controls: </strong></p>
	<p>Left-click: Zoom in</p>
	<p>Right-click: Zoom out</p>
	<p>Alternatively, you can zoom out by clicking the breadcrumb links in the top-left of the visualisation.</p>
</div>
</li>

<!-- li id="levelsToggle"><p>Levels to show:</p>
	<select id="levels" value="1">
	<option value="1">1</option>
	<option value="2">2</option>
	</select>
</li -->

<!--li id="deputyToggle"><p>Include Deputy Directors?</p>
	<span><input type="radio" name="deputies" value="Yes"><label>Yes</label></span>
	<span><input type="radio" name="deputies" value="No" checked><label>No</label></span>
</li-->

<!-- li id="resizeToggle"><p>Resize by:</p>
	<span><input type="radio" name="resizeBy" value="Unit" checked><label>Unit</label></span>
	<span><input type="radio" name="resizeBy" value="Post"><label>Post</label></span>
</li -->

</ul>

	<div id="apiCalls">
		<p class="label">Data sources</p>
		<!-- information about API calls goes here -->
	</div>

</div>

<div id="nodeTip" class="tooltip"></div>

<!-- Scripts -->
<script language="javascript" type="text/javascript"
	src="js/jquery-1.4.2.min.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jit.js"></script>
<script language="javascript" type="text/javascript"
	src="js/overview.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.overlaps.js"></script>
<script language="javascript" type="text/javascript"
	src="js/jquery.qtip.js"></script>		
<script language="javascript" type="text/javascript" src="js/main.js"></script>

<!--[if IE]><script language="javascript" type="text/javascript" src="js/Jit/Extras/excanvas.js"></script><![endif]-->

</body>

</html>
