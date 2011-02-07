<?php ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link type="text/css" href="../css/interface.css" rel="stylesheet">
<link type="text/css" href="../css/gov-structure.css" rel="stylesheet">
<title>Government Overview</title>
<script>
var param_dept = '<?php print $_GET['dept'];?>';
var param_unit = '<?php print $_GET['unit'];?>';
</script>
</head>

<body>

<h1 class="title breadcrumbs">
	<span style="margin-right:5px">Government Structure</span><button id="gov" rel="government">HM Government</button><button id="dept">Department</button><button id="unit">Unit</button>
</h1>

<div id="infovis"></div>
<div id="infobox"></div>
<div id="log" style="border: 1px solid rgb(200, 200, 200);">
	<span>Government Overview</span>
	<img src="images/loading.gif" />
</div>

<div id="right">

		<a class="aboutToggle" href="#">About</a>
		
		<div class="about-tip tip">
		
			<p>This is a treemap visualisation of the UK government's department structure using data provided by data.gov.uk. As more of the <a href="http://data.gov.uk/linked-data" target="_blank">&quot;reference&quot; linked data</a> is made available, this visualisation will change and grow automatically as it accesses the data and is created in the browser in real-time.</p>
		
			<p>The visualisation lets you drill down from the top-level of the government's structure (departments), down into their units and then through to the lowest-level - the unit posts, which are held by people.</p>
			
			<p>The departments and units are both sized by the number of posts they contain and the posts are sized by the number of posts that report to them (i.e. by a measure of responsibility).</p>
		
			<p>When clicking on a post, an organisation chart (organogram) visualisation will load, where you will be able to see more information about who reports to who, their responsibilities and statistics such as salary totals.</p>
		
			<p>To view the sources of data the visualisation uses at any time while using it, there's information provided about all of the the API calls made in the bottom right under "Data sources". Here you can grab the data in several different formats and see which parameters have been used to tailor the data for the visualisation.</p>

			<p><strong>Controls: </strong></p>
			<ul>
				<li>Left-click: Zoom in</li>
				<li>Right-click: Zoom out</li>
				<li>Alternatively, you can zoom out by clicking the breadcrumb links in the top-left of the visualisation or the "Back" button on the right hand side.</li>
			</ul>
			
			<p>Please note: this application is still in development.</p>
			
			<p><i>Powered by <a href="http://code.google.com/p/puelia-php/" target="_blank">Puelia v0.1</a>, an implementation of the <a href="http://code.google.com/p/linked-data-api" target="_blank">Linked Data API</a></i></p>
		</div> <!-- end tip -->
		
		<a class="zoomOut" href="#">Back</a>
		
	<div id="apiCalls">
		<p class="label">Data sources</p>
		<!-- information about API calls goes here -->
	</div>

</div> <!-- end right -->

<div id="nodeTip" class="tooltip"></div>

<!-- Scripts -->
<script language="javascript" type="text/javascript" src="../scripts/jquery-1.4.4.min.js"></script>
<!--script language="javascript" type="text/javascript" src="js/jquery-ui-1.8.8.custom.min.js"></script-->	
<script language="javascript" type="text/javascript" src="../scripts/jquery-ui-1.8.7.min.js"></script>		
<script language="javascript" type="text/javascript" src="../scripts/Jit/jit-yc.js"></script>

<script language="javascript" type="text/javascript" src="../scripts/gov-structure.js"></script>
<script language="javascript" type="text/javascript" src="../scripts/jquery.overlaps.js"></script>
<!--script language="javascript" type="text/javascript" src="js/jquery.qtip.js"></script-->		
<!--script language="javascript" type="text/javascript" src="js/main.js"></script-->

<!--[if IE]><script language="javascript" type="text/javascript" src="../scripts/Jit/Extras/excanvas.js"></script><![endif]-->

</body>

</html>
