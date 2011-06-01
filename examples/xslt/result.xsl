<!--
Note: in at least some versions of libxslt (used by PHP), you can't set global
variables based on values retrieved by a key. Therefore this code contains
lots of redeclarations of the $northing, $easting, $lat, $long, $label,
$prefLabel, $altLabel, $title and $name variables.
-->
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="linked-data-api.xsl" />

<xsl:param name="activeImageBase" select="'/images/green/16x16'" />
<xsl:param name="inactiveImageBase" select="'/images/grey/16x16'" />
<xsl:param name="graphColour" select="'#577D00'" />

<xsl:variable name="openSpaceAPIkey" select="'91BDD27E0581EC9FE0405F0ACA603BCF'" />

<xsl:template match="/">
	<xsl:apply-templates select="result" />
</xsl:template>

<xsl:template match="result">
	<html>
		<head>
			<xsl:apply-templates select="." mode="title" />
			<xsl:apply-templates select="." mode="meta" />
			<xsl:apply-templates select="." mode="script" />
			<xsl:apply-templates select="." mode="style" />
		</head>
		<body>
			<div id="page">
				<xsl:apply-templates select="." mode="header" />
				<xsl:apply-templates select="." mode="content" />
				<xsl:apply-templates select="." mode="footer" />
			</div>
		</body>
	</html>
</xsl:template>

<xsl:template match="result" mode="title">
	<title>Search Results</title>
</xsl:template>

<xsl:template match="result" mode="meta">
	<link rel="shortcut icon" href="/images/datagovuk_favicon.png" type="image/x-icon" /> 
	<xsl:apply-templates select="first | prev | next | last" mode="metalink" />
	<xsl:apply-templates select="format/item" mode="metalink" />
</xsl:template>

<xsl:template match="first | prev | next | last" mode="metalink">
	<link rel="{local-name(.)}" href="{@href}" />
</xsl:template>

<xsl:template match="format/item" mode="metalink">
	<link rel="alternate" href="{@href}" type="{format/label}" />
</xsl:template>

<xsl:template match="result" mode="style">
	<link rel="stylesheet" href="/css/html5reset-1.6.1.css" type="text/css" />
	<link rel="stylesheet" href="/css/jquery-ui.css" type="text/css" />
	<link rel="stylesheet" href="/css/smoothness/jquery-ui.css" type="text/css" />
	<link rel="stylesheet" href="/css/result.css" type="text/css" />
	<xsl:comment>
		<xsl:text>[if lt IE 9]&gt;</xsl:text>
		<xsl:text>&lt;link rel="stylesheet" href="/css/ie.css" type="text/css">&lt;/link></xsl:text>
		<xsl:text>&lt;![endif]</xsl:text>
	</xsl:comment>
</xsl:template>

<xsl:template match="result" mode="script">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="showMap">
		<xsl:apply-templates select="." mode="showMap" />
	</xsl:variable>
	<xsl:comment>
		<xsl:text>[if lt IE 9]&gt;</xsl:text>
		<xsl:text>&lt;script src="http://html5shiv.googlecode.com/svn/trunk/html5.js">&lt;/script></xsl:text>
		<xsl:text>&lt;![endif]</xsl:text>
	</xsl:comment>
	<xsl:if test="$showMap = 'true'">
		<script type="text/javascript"
     src="http://openspace.ordnancesurvey.co.uk/osmapapi/openspace.js?key={$openSpaceAPIkey}"></script>
	</xsl:if>
	<script type="text/javascript" src="/scripts/jquery.min.js"></script>
	<script type="text/javascript" src="/scripts/jquery-ui.min.js"></script>
	<script type="text/javascript" src="/scripts/jquery.sparkline.js"></script>
	<script type="text/javascript" src="/scripts/codemirror/codemirror_min.js"></script>
	<script type="text/javascript">
		$(function() {
			$('.info img')
				.toggle(function () {
					$(this)
						.attr('src', '<xsl:value-of select="$activeImageBase"/>/Cancel.png')
						.next().show();
				}, function () {
					$(this)
						.attr('src', '<xsl:value-of select="$activeImageBase"/>/Question.png')
						.next().fadeOut('slow');
				});
			
			$('input[type=date]').datepicker({
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				autoSize: true
			});
			
			$('#search').hide();
			
			$('#openSearch')
				.toggle(function () {
					$(this).text('Hide Search Form');
					$('#search').slideDown('slow');
				}, function () {
					$(this).text('Show Search Form');
					$('#search').slideUp('slow');
				});
			
			$('.provenance textarea')
				.each(function () {
					var skipLines = parseFloat($(this).attr('data-skip-lines'), 10);
					var lineHeight = parseFloat($(this).css('line-height'), 10);
					$(this).scrollTop(skipLines * lineHeight);
					var cm = CodeMirror.fromTextArea(this, {
						basefiles: ["/scripts/codemirror/codemirror_base_sparql.js"],
						stylesheet: "/css/sparql.css",
						textWrapping: false
					});
					$(cm.frame).load(function () {
						cm.jumpToLine(skipLines + 1);
						$(cm.frame)
							.css('border', 	'1px solid #D3D3D3')
							.css('border-radius', '5px')
							.css('-moz-border-radius', '5px');
					});
				});
			
			<xsl:if test="$showMap = 'true'">
				<xsl:variable name="uri">
					<xsl:call-template name="clearPosition">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="sep">
					<xsl:choose>
						<xsl:when test="contains($uri, '?')">&amp;</xsl:when>
						<xsl:otherwise>?</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="mapProperty" select="(//*[*[name(.) = $easting] and *[name(.) = $northing]])[1]" />
				<xsl:variable name="mapParam">
					<xsl:apply-templates select="$mapProperty" mode="paramHierarchy" />
				</xsl:variable>
				<xsl:variable name="eastingParam" select="concat($mapParam, '.', $easting)" />
				<xsl:variable name="northingParam" select="concat($mapParam, '.', $northing)" />
				<xsl:variable name="properties">
					<xsl:if test="not(/result/items)">_properties=<xsl:value-of select="$eastingParam"/>,<xsl:value-of select="$northingParam"/>&amp;</xsl:if>
				</xsl:variable>
				initMap();
				
				$('.map .search').click(function() {
					var bounds = summaryMap.getExtent();
					var minEasting = Math.ceil(bounds.left);
					var maxEasting = Math.floor(bounds.right);
					var minNorthing = Math.ceil(bounds.bottom);
					var maxNorthing = Math.floor(bounds.top);
					var midEasting = minEasting + ((maxEasting - minEasting) / 2);
					var midNorthing = minNorthing + ((maxNorthing - minNorthing) / 2);
					var orderBy = <xsl:if test="not(contains($uri, '_sort='))">(maxEasting - minEasting) &lt; 2000 ? '&amp;_orderBy=(((?<xsl:value-of select="$easting"/> - ' + midEasting + ')*(?<xsl:value-of select="$easting"/>- ' + midEasting + '))%2B((?<xsl:value-of select="$northing"/> - ' + midNorthing + ')*(?<xsl:value-of select="$northing"/> - ' + midNorthing + ')))' : </xsl:if>'';
					window.location = '<xsl:value-of select="concat($uri, $sep, $properties)"/>min-<xsl:value-of select="$eastingParam"/>=' + minEasting + '&amp;max-<xsl:value-of select="$eastingParam"/>=' + maxEasting + '&amp;min-<xsl:value-of select="$northingParam"/>=' + minNorthing + '&amp;max-<xsl:value-of select="$northingParam"/>=' + maxNorthing + orderBy;
				});
			</xsl:if>
		});
	</script>
</xsl:template>

<xsl:template name="clearPosition">
	<xsl:param name="uri" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:call-template name="substituteParam">
		<xsl:with-param name="uri">
			<xsl:call-template name="substituteParam">
				<xsl:with-param name="uri">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri" select="$uri" />
								<xsl:with-param name="param" select="concat('max-', $northing)" />
								<xsl:with-param name="value" select="''" />
							</xsl:call-template>
						</xsl:with-param>
						<xsl:with-param name="param" select="concat('min-', $northing)" />
						<xsl:with-param name="value" select="''" />
					</xsl:call-template>
				</xsl:with-param>
				<xsl:with-param name="param" select="concat('max-', $easting)" />
				<xsl:with-param name="value" select="''" />
			</xsl:call-template>
		</xsl:with-param>
		<xsl:with-param name="param" select="concat('min-', $easting)" />
		<xsl:with-param name="value" select="''" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="result" mode="showMap">
	<xsl:param name="items" select="items/item[position() &lt;= 10]/descendant-or-self::*[*] | primaryTopic[not(../items)]/descendant-or-self::*[*]" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:choose>
		<xsl:when test="not($items)">
			<xsl:variable name="minEasting">
				<xsl:call-template name="paramValue">
					<xsl:with-param name="uri" select="@href" />
					<xsl:with-param name="param" select="concat('min-', $easting)" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:value-of select="$minEasting != ''" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="showMapForItems">
				<xsl:with-param name="items" select="$items" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="showMapForItems">
	<xsl:param name="items" />
	<xsl:variable name="showMap">
		<xsl:apply-templates select="$items[1]" mode="showMap" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$showMap = 'true'">true</xsl:when>
		<xsl:when test="not($items)">false</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="showMapForItems">
				<xsl:with-param name="items" select="$items[position() > 1]" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="showMap">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:choose>
		<xsl:when test="*[name(.) = $easting] and *[name(.) = $northing]">true</xsl:when>
		<xsl:otherwise>false</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="header">
	<nav class="site">
		<xsl:apply-templates select="." mode="formats" />
	</nav>
	<header>
		<h1><a href="/">Linked Data API</a></h1>
	</header>
</xsl:template>

<xsl:template match="result" mode="footer">
	<footer>
		<xsl:apply-templates select="wasResultOf" mode="footer" />
		<p>
			<xsl:text>Powered by </xsl:text>
			<xsl:apply-templates select="wasResultOf/processor" mode="footer" />
			<xsl:text>an implementation of the </xsl:text>
			<a href="http://code.google.com/p/linked-data-api">Linked Data API</a><br />
			<a href="http://www.axialis.com/free/icons">Icons</a> by <a href="http://www.axialis.com">Axialis Team</a>
		</p>
	</footer>
</xsl:template>

<xsl:template match="wasResultOf" mode="footer">
	<div class="provenance">
		<xsl:apply-templates select="selectionResult[query/value != '']" mode="footer" />
		<xsl:apply-templates select="viewingResult" mode="footer" />
	</div>
</xsl:template>

<xsl:template match="viewingResult | selectionResult" mode="footer">
	<div>
		<xsl:attribute name="class">
			<xsl:text> query col</xsl:text>
			<xsl:choose>
				<xsl:when test="self::viewingResult[../selectionResult/query/value != '']">2</xsl:when>
				<xsl:otherwise>1</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
		<h2>
			<xsl:choose>
				<xsl:when test="self::viewingResult">Viewer</xsl:when>
				<xsl:otherwise>Selection</xsl:otherwise>
			</xsl:choose>
		</h2>
		<p>
			<xsl:text>This is the SPARQL query that was generated to </xsl:text>
			<xsl:choose>
				<xsl:when test="self::viewingResult">
					<xsl:text>pull together the data that is provided about</xsl:text>
					<xsl:choose>
						<xsl:when test="/result/items"> each item.</xsl:when>
						<xsl:otherwise> the selected item.</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>identify the items to be shown in the page.</xsl:otherwise>
			</xsl:choose>
			<xsl:text> You can modify it here and re-run the query but you may find more options at the </xsl:text>
			<a href="{endpoint/url/@href}">endpoint's page</a>
			<xsl:text>.</xsl:text>
		</p>
		<form action="{endpoint/url/@href}" method="post">
			<xsl:apply-templates select="query" mode="footer" />
			<p>
				<button type="submit">Run Query</button>
			</p>
		</form>
	</div>
</xsl:template>

<xsl:template match="query" mode="footer">
	<textarea name="query" wrap="off">
		<xsl:attribute name="data-skip-lines">
			<xsl:apply-templates select="." mode="skipLines" />
		</xsl:attribute>
		<xsl:value-of select="value" />
	</textarea>
</xsl:template>

<xsl:template match="query" mode="skipLines">
	<xsl:param name="query" select="translate(value, $uppercase, $lowercase)" />
	<xsl:param name="count" select="0" />
	<xsl:variable name="firstLine" select="substring-before($query, '&#xA;')" />
	<xsl:choose>
		<xsl:when test="starts-with($firstLine, 'prefix ') or (normalize-space($query) != '' and normalize-space($firstLine) = '')">
			<xsl:apply-templates select="." mode="skipLines">
				<xsl:with-param name="query" select="substring-after($query, '&#xA;')" />
				<xsl:with-param name="count" select="$count + 1" />
			</xsl:apply-templates>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$count" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="processor" mode="footer">
	<xsl:variable name="project" select="software/releaseOf" />
	<xsl:variable name="softwareLink">
		<xsl:choose>
			<xsl:when test="$project/@href">
				<xsl:value-of select="$project/@href" />
			</xsl:when>
			<xsl:when test="$project/homepage/@href">
				<xsl:value-of select="$project/homepage/@href" />
			</xsl:when>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="softwareLabel">
		<xsl:choose>
			<xsl:when test="software/label">
				<xsl:value-of select="software/label" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$project/label" />
				<xsl:apply-templates select="software/revision" mode="footer" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="normalize-space($softwareLink) = ''">
			<xsl:copy-of select="$softwareLabel" />
		</xsl:when>
		<xsl:otherwise>
			<a href="{$softwareLink}">
				<xsl:value-of select="$softwareLabel" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:text>, </xsl:text>
</xsl:template>

<xsl:template match="software/revision" mode="footer">
	<xsl:text> v</xsl:text>
	<xsl:value-of select="." />
</xsl:template>

<xsl:template match="result" mode="formats">
	<section class="formats">
		<ul>
			<xsl:for-each select="format/item">
				<li>
					<xsl:if test="position() = 1">
						<xsl:attribute name="class">first</xsl:attribute>
					</xsl:if>
					<xsl:if test="position() = last()">
						<xsl:attribute name="class">last</xsl:attribute>
					</xsl:if>
					<xsl:apply-templates select="." mode="nav" />
				</li>
			</xsl:for-each>
		</ul>
	</section>
</xsl:template>

<xsl:template match="result" mode="lastmod">
	<p>
		<time pubdate="pubdate"><xsl:value-of select="modified" /></time>
	</p>
</xsl:template>

<xsl:template match="result" mode="content" priority="10">
	<xsl:apply-templates select="." mode="topnav" />
	<div id="result">
		<div class="panel">
			<xsl:choose>
				<xsl:when test="items">
					<header>
						<xsl:if test="items/item">
							<p id="openSearch">Show Search Form</p>
						</xsl:if>
						<h1>Search Results</h1>
					</header>
					<xsl:if test="items/item">
						<xsl:apply-templates select="." mode="search" />
					</xsl:if>
					<xsl:apply-templates select="items" mode="content" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="primaryTopic" mode="content" />
				</xsl:otherwise>
			</xsl:choose>
		</div>
	</div>
	<xsl:apply-templates select="." mode="bottomnav" />
</xsl:template>

<xsl:template match="result" mode="topnav">
	<xsl:variable name="hasResults" select="items/item[@href]" />
	<xsl:variable name="isItem" select="not(items) and primaryTopic" />
	<nav class="topnav">
		<xsl:apply-templates select="." mode="moreinfo" />
		<xsl:apply-templates select="." mode="map" />
		<xsl:if test="$hasResults">
			<xsl:if test="not(next)">
				<xsl:apply-templates select="." mode="graphs" />
			</xsl:if>
			<xsl:apply-templates select="." mode="summary" />
		</xsl:if>
		<xsl:if test="not($isItem)">
			<xsl:apply-templates select="." mode="filternav" />
		</xsl:if>
		<xsl:if test="$hasResults">
			<xsl:apply-templates select="." mode="sortnav" />
		</xsl:if>
		<xsl:if test="$hasResults or $isItem">
			<xsl:apply-templates select="." mode="viewnav" />
		</xsl:if>
		<xsl:if test="$hasResults">
			<xsl:apply-templates select="." mode="sizenav" />
		</xsl:if>
	</nav>
</xsl:template>
	
<xsl:template match="result" mode="map">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="showMap">
		<xsl:apply-templates select="." mode="showMap" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$showMap = 'true'">
			<xsl:variable name="markers" select="items//*[*[name(.) = $easting] and *[name(.) = $northing]] | primaryTopic[not(../items)]/descendant-or-self::*[*[name(.) = $easting] and *[name(.) = $northing]]" />
			<xsl:variable name="multipleMarkers" select="count($markers) > 1" />
			<xsl:variable name="minEasting">
				<xsl:choose>
					<xsl:when test="$multipleMarkers">
						<xsl:call-template name="min">
							<xsl:with-param name="values" select="$markers/*[name(.) = $easting]" />
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$markers">
						<xsl:value-of select="$markers/*[name(.) = $easting]" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="concat('min-', $easting)" />
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="maxEasting">
				<xsl:choose>
					<xsl:when test="$multipleMarkers">
						<xsl:call-template name="max">
							<xsl:with-param name="values" select="$markers/*[name(.) = $easting]" />
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$markers">
						<xsl:value-of select="$markers/*[name(.) = $easting]" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="concat('max-', $easting)" />
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="minNorthing">
				<xsl:choose>
					<xsl:when test="$multipleMarkers">
						<xsl:call-template name="min">
							<xsl:with-param name="values" select="$markers/*[name(.) = $northing]" />
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$markers">
						<xsl:value-of select="$markers/*[name(.) = $northing]" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="concat('min-', $northing)" />
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="maxNorthing">
				<xsl:choose>
					<xsl:when test="$multipleMarkers">
						<xsl:call-template name="max">
							<xsl:with-param name="values" select="$markers/*[name(.) = $northing]" />
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$markers">
						<xsl:value-of select="$markers/*[name(.) = $northing]" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="concat('max-', $northing)" />
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="searchMap" 
				select="//*[*[name(.) = $easting] and *[name(.) = $northing]]" />
			<section class="map">
				<h1>Map</h1>
				<xsl:call-template name="createInfo">
					<xsl:with-param name="text">
						<xsl:text>This map shows the items that are listed on this page. </xsl:text>
						<xsl:text>There might be other items that match your query that aren't shown on this map.</xsl:text>
						<xsl:if test="$searchMap">
							<xsl:text> If you want to search in a different area, move to that area and click the </xsl:text>
							<img src="{$activeImageBase}/Search.png" alt="search" />
							<xsl:text> icon.</xsl:text>
						</xsl:if>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:if test="$searchMap">
					<p class="search">
						<img src="{$activeImageBase}/Search.png" alt="search" />
					</p>
				</xsl:if>
				<div class="mapWrapper">
					<div id="map">
					</div>
				</div>
				<script type="text/javascript">
					function initMap() {
						var controls = [
							new OpenLayers.Control.Navigation(),
							new OpenLayers.Control.KeyboardDefaults(),
							new OpenSpace.Control.CopyrightCollection({displayClass:"osCopyright"}),
							new OpenLayers.Control.ArgParser()
						];
						summaryMap = new OpenSpace.Map('map', {controls: controls});
						summaryMap.addControl(new OpenSpace.Control.SmallMapControl());
						var info;
						<xsl:choose>
							<xsl:when test="$multipleMarkers">
					      var bounds = new OpenLayers.Bounds(<xsl:value-of select="$minEasting"/>, <xsl:value-of select="$minNorthing"/>, <xsl:value-of select="$maxEasting"/>, <xsl:value-of select="$maxNorthing"/>);
								var zoom = Math.min(<xsl:choose><xsl:when test="/result/next">7</xsl:when><xsl:otherwise>10</xsl:otherwise></xsl:choose>, summaryMap.getZoomForExtent(bounds));
								var center = new OpenSpace.MapPoint(<xsl:value-of select="$minEasting + floor(($maxEasting - $minEasting) div 2)" />, <xsl:value-of select="$minNorthing + floor(($maxNorthing - $minNorthing) div 2)" />);
								summaryMap.setCenter(center, zoom);
							</xsl:when>
							<xsl:when test="$markers">
								var center = new OpenSpace.MapPoint(<xsl:value-of select="$markers/*[name(.) = $easting]" />, <xsl:value-of select="$markers/*[name(.) = $northing]" />);
								summaryMap.setCenter(center, 7);
							</xsl:when>
							<xsl:otherwise>
								var bounds = new OpenLayers.Bounds(<xsl:value-of select="$minEasting"/>, <xsl:value-of select="$minNorthing"/>, <xsl:value-of select="$maxEasting"/>, <xsl:value-of select="$maxNorthing"/>);
								summaryMap.zoomToExtent(bounds);
							</xsl:otherwise>
						</xsl:choose>
			      var markers = new OpenLayers.Layer.Markers("Markers");
			      summaryMap.addLayer(markers);
			      var size = new OpenLayers.Size(16,16);
						var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
						var icon = new OpenLayers.Icon('<xsl:value-of select="$activeImageBase"/>/Target.png', size, offset);
			      var pos;
			      var marker;
			      <xsl:for-each select="$markers">
			      	<xsl:sort select="*[name(.) = $northing]" order="descending" data-type="number" />
			      	<xsl:sort select="*[name(.) = $easting]" order="descending" data-type="number" />
				      pos = new OpenSpace.MapPoint(<xsl:value-of select="*[name(.) = $easting]" />, <xsl:value-of select="*[name(.) = $northing]"/>);
				      marker = new OpenLayers.Marker(pos, icon.clone());
				      <xsl:if test="/result/items">
					      marker.events.on({
					      	mouseover: function () {
					      		info.setHTML('&lt;div class=\"mapInfo\">&lt;a href=\"#<xsl:value-of select="generate-id(.)"/>\"><xsl:call-template name="jsEscape"><xsl:with-param name="string"><xsl:apply-templates select="." mode="name" /></xsl:with-param></xsl:call-template>&lt;/a>&lt;/div>');
					      	}
					      });
				      </xsl:if>
				      markers.addMarker(marker);
			      </xsl:for-each>
						<xsl:if test="$multipleMarkers">
							info = new OpenSpace.Layer.ScreenOverlay("info");
							info.setPosition(new OpenLayers.Pixel(85, 0));
							summaryMap.addLayer(info);
							info.setHTML('&lt;div class=\"mapInfo\">Mouse over a marker&lt;/div>');
						</xsl:if>
						<xsl:for-each select="$markers">
							var controls = [new OpenLayers.Control.ArgParser()];
							osMap = new OpenSpace.Map('<xsl:value-of select="concat('map', generate-id(.))"/>', {controls: controls});
							var center = new OpenSpace.MapPoint(<xsl:value-of select="*[name(.) = $easting]" />, <xsl:value-of select="*[name(.) = $northing]" />);
					    osMap.setCenter(center, 9);
					    var markers = new OpenLayers.Layer.Markers("Markers");
					    osMap.addLayer(markers);
					    var size = new OpenLayers.Size(16,16);
							var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
							var icon = new OpenLayers.Icon('<xsl:value-of select="$activeImageBase"/>/Target.png', size, offset);
					    pos = new OpenSpace.MapPoint(<xsl:value-of select="*[name(.) = $easting]" />, <xsl:value-of select="*[name(.) = $northing]"/>);
					    marker = new OpenLayers.Marker(pos, icon);
					    markers.addMarker(marker);
						</xsl:for-each>
					};
				</script>
			</section>
		</xsl:when>
		<xsl:otherwise>
			<script type="text/javascript">
				function initMap() {
					return null;
				};
			</script>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template match="result" mode="graphs">
	<xsl:variable name="rows">
		<xsl:for-each select="items/item/*[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
			<xsl:sort select="local-name()" />
			<xsl:apply-templates select="." mode="graphRow" />
		</xsl:for-each>
	</xsl:variable>
	<xsl:if test="$rows != ''">
		<section class="graphs">
			<h1>Graphs</h1>
			<xsl:call-template name="createInfo">
				<xsl:with-param name="text">These graphs summarise the values of the numeric properties of these items.</xsl:with-param>
			</xsl:call-template>
			<table>
				<xsl:copy-of select="$rows" />
			</table>
		</section>
	</xsl:if>
</xsl:template>
	
<xsl:template match="*" mode="graphRow">
	<xsl:param name="parentName" select="''" />
	<xsl:variable name="propertyName">
		<xsl:if test="$parentName != ''">
			<xsl:value-of select="$parentName" />
			<xsl:text>.</xsl:text>
		</xsl:if>
		<xsl:value-of select="name()" />
	</xsl:variable>
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasNonLabelProperties = 'true'">
			<xsl:for-each select="key('properties', $propertyName)/*[name() != 'item' and generate-id(key('properties', concat($propertyName, '.', name(.)))[1]) = generate-id(.)] |
				key('properties', concat($propertyName, '.item'))/*[generate-id(key('properties', concat($propertyName, '.item.', name(.)))[1]) = generate-id(.)]">
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="graphRow">
					<xsl:with-param name="parentName" select="$propertyName" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:when test="@datatype = 'integer' or @datatype = 'decimal' or @datatype = 'int' or @datatype = 'float' or @datatype = 'double'">
			<xsl:variable name="properties" select="key('properties', $propertyName)" />
			<xsl:variable name="valueSummary">
				<xsl:for-each select="$properties">
					<xsl:sort select="." data-type="number" />
					<xsl:value-of select="." />
					<xsl:choose>
						<xsl:when test="position() = last()">!<xsl:value-of select="."/></xsl:when>
						<xsl:otherwise>,</xsl:otherwise>
					</xsl:choose>
				</xsl:for-each>
			</xsl:variable>
			<xsl:variable name="values" select="substring-before($valueSummary, '!')" />
			<xsl:variable name="distinctValues">
				<xsl:call-template name="numberDistinctValues">
					<xsl:with-param name="values" select="$properties" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="showBarchart">
				<xsl:apply-templates select="." mode="showBarchart">
					<xsl:with-param name="values" select="$properties" />
					<xsl:with-param name="distinctValues" select="$distinctValues" />
				</xsl:apply-templates>
			</xsl:variable>
			<xsl:if test="$showBarchart = 'true'">
				<xsl:variable name="groups">
					<xsl:choose>
						<xsl:when test="$distinctValues &lt; 10">10</xsl:when>
						<xsl:otherwise>20</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="maximum" select="substring-after($valueSummary, '!')" />
				<xsl:variable name="minimum" select="substring-before($valueSummary, ',')" />
				<xsl:variable name="start">
					<xsl:choose>
						<xsl:when test="$minimum &lt; ($maximum div 2)">0</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$minimum" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="step" select="($maximum - $start) div $groups" />
				<xsl:variable name="grouped">
					<xsl:call-template name="valueGroups">
						<xsl:with-param name="values" select="concat($values, ',')" />
						<xsl:with-param name="step" select="$step" />
						<xsl:with-param name="limit" select="$start + $step" />
					</xsl:call-template>
				</xsl:variable>
				<tr>
					<th class="label">
						<xsl:apply-templates select="." mode="contextLabel" />
					</th>
					<td class="barchart" id="barchart{generate-id(.)}">
						<script type="text/javascript">
						$('#barchart<xsl:value-of select="generate-id(.)"/>').sparkline([<xsl:value-of select="$grouped" />], { type: 'bar', barColor: '<xsl:value-of select="$graphColour"/>' });
					</script>
					</td>
				</tr>
			</xsl:if>
			<xsl:variable name="showSparkline">
				<xsl:apply-templates select="." mode="showSparkline">
					<xsl:with-param name="values" select="$properties" />
					<xsl:with-param name="distinctValues" select="$distinctValues" />
					<xsl:with-param name="sort">
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="'_sort'" />
						</xsl:call-template>
					</xsl:with-param>
				</xsl:apply-templates>
			</xsl:variable>
			<xsl:if test="$showSparkline = 'true'">
				<xsl:variable name="valueArray">
					<xsl:text>[</xsl:text>
					<xsl:for-each select="$properties">
						<xsl:value-of select="." />
						<xsl:if test="position() != last()">,</xsl:if>
					</xsl:for-each>
					<xsl:text>]</xsl:text>
				</xsl:variable>
				<tr>
					<th class="label">
						<xsl:apply-templates select="." mode="contextLabel" />
					</th>
					<td class="linegraph" id="linegraph{generate-id(.)}">
						<script type="text/javascript">
						$('#linegraph<xsl:value-of select="generate-id(.)"/>').sparkline(<xsl:value-of select="$valueArray" />, { lineColor: '<xsl:value-of select="$graphColour"/>', fillColor: false, width: '100%' });
					</script>
					</td>
				</tr>
			</xsl:if>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="showBarchart">
	<xsl:param name="values" />
	<xsl:param name="distinctValues">
		<xsl:call-template name="numberDistinctValues">
			<xsl:with-param name="values" select="$values" />
		</xsl:call-template>
	</xsl:param>
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:choose>
		<xsl:when test="name(.) = $easting or name(.) = $northing or name(.) = $lat or name(.) = $long" />
		<xsl:otherwise>
			<xsl:value-of select="$distinctValues > 5" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="showSparkline">
	<xsl:param name="values" />
	<xsl:param name="distinctValues" />
	<xsl:param name="sort" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:choose>
		<xsl:when test="name(.) = $easting or name(.) = $northing or name(.) = $lat or name(.) = $long" />
		<xsl:otherwise>
			<xsl:value-of select="$distinctValues > 1 and $sort != ''" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="valueGroups">
	<xsl:param name="values" />
	<xsl:param name="step" />
	<xsl:param name="limit" />
	<xsl:param name="count" select="0" />
	<xsl:variable name="first" select="substring-before($values, ',')" />
	<xsl:variable name="rest" select="substring-after($values, ',')" />
	<xsl:choose>
		<xsl:when test="$first &lt;= $limit">
			<xsl:choose>
				<xsl:when test="$rest = ''">
					<xsl:value-of select="$count + 1" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="valueGroups">
						<xsl:with-param name="values" select="$rest" />
						<xsl:with-param name="step" select="$step" />
						<xsl:with-param name="limit" select="$limit" />
						<xsl:with-param name="count" select="$count + 1" />
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$count" />
			<xsl:text>,</xsl:text>
			<xsl:call-template name="valueGroups">
				<xsl:with-param name="values" select="$values" />
				<xsl:with-param name="step" select="$step" />
				<xsl:with-param name="limit" select="$limit + $step" />
				<xsl:with-param name="count" select="0" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="summary">
	<xsl:if test="count(items/item) > 1">
		<section class="summary">
			<h1>On This Page</h1>
			<xsl:call-template name="createInfo">
				<xsl:with-param name="text">Links to the items within this page, and to the previous and/or next pages of results.</xsl:with-param>
			</xsl:call-template>
			<ul>
				<xsl:if test="prev">
					<li>
						<xsl:apply-templates select="prev" mode="nav" />
					</li>
				</xsl:if>
				<xsl:for-each select="items/item">
					<li>
						<a href="#{generate-id(.)}" title="jump to item on this page">
							<xsl:apply-templates select="." mode="name" />
						</a>
					</li>
				</xsl:for-each>
				<xsl:if test="next">
					<li>
						<xsl:apply-templates select="next" mode="nav" />
					</li>
				</xsl:if>
			</ul>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template match="result" mode="moreinfo">
	<xsl:variable name="links">
		<xsl:apply-templates select="primaryTopic | isPartOf" mode="moreinfo" />
	</xsl:variable>
	<xsl:if test="string($links) != ''">
		<section class="moreinfo">
			<h1>Browse</h1>
			<xsl:call-template name="createInfo">
				<xsl:with-param name="text">Links to further information.</xsl:with-param>
			</xsl:call-template>
			<xsl:copy-of select="$links" />
		</section>
	</xsl:if>
</xsl:template>

<xsl:template match="primaryTopic | items" mode="moreinfo" />

<xsl:template name="moreinfoLink">
	<xsl:param name="uri" />
	<xsl:param name="current" />
	<xsl:param name="label" />
	<li>
		<xsl:choose>
			<xsl:when test="$uri = $current">
				<span class="current"><xsl:value-of select="$label" /></span>
			</xsl:when>
			<xsl:otherwise>
				<a href="{$uri}"><xsl:value-of select="$label" /></a>
			</xsl:otherwise>
		</xsl:choose>
	</li>
</xsl:template>

<xsl:template match="*" mode="name">
	<xsl:variable name="bestLabelParam">
		<xsl:apply-templates select="." mode="bestLabelParam" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$bestLabelParam != ''">
			<xsl:variable name="label" select="*[name() = $bestLabelParam]" />
			<xsl:choose>
				<xsl:when test="$label/item">
					<xsl:for-each select="$label/item[not(. = preceding-sibling::item)]">
						<xsl:sort select="@xml:lang = 'en'" order="descending" />
						<xsl:sort select="@xml:lang" />
						<xsl:apply-templates select="." mode="content" />
						<xsl:if test="position() != last()"> / </xsl:if>
					</xsl:for-each>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="$label" mode="content" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:when test="@href and not(starts-with(@href, 'http://api.talis.com/'))">
			<xsl:call-template name="lastURIpart">
				<xsl:with-param name="uri" select="@href" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>item </xsl:text>
			<xsl:value-of select="position()" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="filternav">
	<xsl:variable name="searchURI">
		<xsl:apply-templates select="." mode="searchURI" />
	</xsl:variable>
	<xsl:variable name="filters">
		<xsl:call-template name="extractFilters">
			<xsl:with-param name="params" select="substring-after($searchURI, '?')" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:if test="$filters != ''">
		<section class="filter">
			<h1>Filter</h1>
			<xsl:call-template name="createInfo">
				<xsl:with-param name="text">These are the filters currently being used to limit the search results. Click on the <img src="{$activeImageBase}/Back.png" alt="remove filter" /> icon to remove the filter.</xsl:with-param>
			</xsl:call-template>
			<table>
				<xsl:copy-of select="$filters" />
			</table>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template name="extractFilters">
	<xsl:param name="params" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="param">
		<xsl:choose>
			<xsl:when test="contains($params, '&amp;')">
				<xsl:value-of select="substring-before($params, '&amp;')" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$params" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:if test="not(starts-with($param, '_')) and not(starts-with($param, concat('max-', $easting, '=')) or starts-with($param, concat('min-', $northing, '=')) or starts-with($param, concat('max-', $northing, '=')))">
		<xsl:variable name="paramName" select="substring-before($param, '=')" />
		<xsl:variable name="isLabelParam">
			<xsl:call-template name="isLabelParam">
				<xsl:with-param name="paramName" select="$paramName" />
			</xsl:call-template>
		</xsl:variable>
		<tr>
			<xsl:choose>
				<xsl:when test="$paramName = concat('min-', $easting)">
					<th class="label" colspan="2">area of map</th>
					<td class="filter">
						<a title="remove filter">
							<xsl:attribute name="href">
								<xsl:call-template name="clearPosition">
									<xsl:with-param name="uri">
										<xsl:apply-templates select="/result" mode="searchURI" />
									</xsl:with-param>
								</xsl:call-template>
							</xsl:attribute>
							<img src="{$activeImageBase}/Back.png" alt="remove filter" />
						</a>
					</td>
				</xsl:when>
				<xsl:otherwise>
					<th class="label">
						<xsl:choose>
							<xsl:when test="$isLabelParam = 'true'">
								<xsl:value-of select="$paramName" />
							</xsl:when>
							<xsl:when test="$paramName = concat('min-', $easting)">area on map</xsl:when>
							<xsl:otherwise>
								<xsl:call-template name="splitPath">
									<xsl:with-param name="paramName" select="$paramName" />
								</xsl:call-template>
							</xsl:otherwise>
						</xsl:choose>
					</th>
					<td class="value">
						<xsl:call-template name="unescapeValue">
							<xsl:with-param name="value" select="substring-after($param, '=')" />
						</xsl:call-template>
					</td>
					<td class="filter">
						<a title="remove filter">
							<xsl:attribute name="href">
								<xsl:call-template name="substituteParam">
									<xsl:with-param name="uri">
										<xsl:apply-templates select="/result" mode="searchURI" />
									</xsl:with-param>
									<xsl:with-param name="param" select="$paramName" />
									<xsl:with-param name="value" select="''" />
								</xsl:call-template>
							</xsl:attribute>
							<img src="{$activeImageBase}/Back.png" alt="remove filter" />
						</a>
					</td>
				</xsl:otherwise>
			</xsl:choose>
		</tr>
	</xsl:if>
	<xsl:if test="contains($params, '&amp;')">
		<xsl:call-template name="extractFilters">
			<xsl:with-param name="params" select="substring-after($params, '&amp;')" />
		</xsl:call-template>
	</xsl:if>
</xsl:template>

<xsl:template match="result" mode="viewnav">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="view">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="@href" />
			<xsl:with-param name="param" select="'_view'" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="properties">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="@href" />
			<xsl:with-param name="param" select="'_properties'" />
		</xsl:call-template>
	</xsl:variable>
	<section class="view">
		<h1>View</h1>
		<xsl:call-template name="createInfo">
			<xsl:with-param name="text">
				<xsl:text>Choose what information you want to view about each item. </xsl:text>
				<xsl:text>There are some pre-defined views, but starred properties are always present no matter what the view. </xsl:text> 
				<xsl:text>You can star properties by clicking on the </xsl:text>
				<img src="{$inactiveImageBase}/Star.png" alt="star this property" />
				<xsl:text> icon. The currently starred icons have a </xsl:text>
				<img src="{$activeImageBase}/Star.png" alt="unstar this property" />
				<xsl:text> icon; clicking on it will unstar the property.</xsl:text>
			</xsl:with-param>
		</xsl:call-template>
		<xsl:if test="$properties != ''">
			<p class="reset">
				<a title="unstar all properties">
					<xsl:attribute name="href">
						<xsl:call-template name="substituteParam">
							<xsl:with-param name="uri" select="/result/@href" />
							<xsl:with-param name="param" select="'_properties'" />
							<xsl:with-param name="value" select="''" />
						</xsl:call-template>
					</xsl:attribute>
					<img src="{$activeImageBase}/Back.png" alt="reset" />
				</a>
			</p>
		</xsl:if>
		<ul>
			<xsl:for-each select="version/item | version[not(item)]">
				<li>
					<xsl:apply-templates select="." mode="nav">
						<xsl:with-param name="current" select="$view" />
					</xsl:apply-templates>
				</li>
			</xsl:for-each>
		</ul>
		<ul class="properties">
			<xsl:if test="$properties != ''">
				<xsl:apply-templates select="." mode="selectedProperties">
					<xsl:with-param name="properties" select="$properties" />
				</xsl:apply-templates>
			</xsl:if>
			<xsl:for-each select="(items/item/* | primaryTopic[not(../items)]/*)[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
				<xsl:sort select="name(.) = $prefLabel" order="descending" />
				<xsl:sort select="name(.) = $name" order="descending" />
				<xsl:sort select="name(.) = $title" order="descending" />
				<xsl:sort select="name(.) = $label" order="descending" />
				<xsl:sort select="name(.) = $altLabel" order="descending" />
				<xsl:sort select="name(.) = $easting" order="descending" />
				<xsl:sort select="name(.) = $northing" order="descending" />
				<xsl:sort select="name(.) = $lat" order="descending" />
				<xsl:sort select="name(.) = $long" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="propertiesentry">
					<xsl:with-param name="properties" select="$properties" />
				</xsl:apply-templates>
			</xsl:for-each>
		</ul>
	</section>
</xsl:template>
	
<xsl:template match="result" mode="selectedProperties">
	<xsl:param name="properties" />
	<xsl:param name="previousProperties" select="''" />
	<xsl:variable name="property" select="substring-before(concat($properties, ','), ',')" />
	<xsl:variable name="paramName">
		<xsl:choose>
			<xsl:when test="starts-with($property, '-')">
				<xsl:value-of select="substring($property, 2)" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$property" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="isLabelParam">
		<xsl:call-template name="isLabelParam">
			<xsl:with-param name="paramName" select="$paramName" />
		</xsl:call-template>
	</xsl:variable>
	<li class="selected">
		<a rel="nofollow" title="remove this property">
			<xsl:attribute name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri" select="@href" />
					<xsl:with-param name="param" select="'_properties'" />
					<xsl:with-param name="value">
						<xsl:if test="$previousProperties != ''">
							<xsl:value-of select="$previousProperties" />
							<xsl:text>,</xsl:text>
						</xsl:if>
						<xsl:value-of select="substring-after($properties, ',')" />
					</xsl:with-param> 
				</xsl:call-template>
			</xsl:attribute>
			<img src="{$activeImageBase}/Star.png" alt="unstar this property" />
		</a>
		<xsl:text> </xsl:text>
		<xsl:choose>
			<xsl:when test="$isLabelParam = 'true'">
				<xsl:value-of select="$paramName" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="splitPath">
					<xsl:with-param name="paramName" select="$paramName" />
					<xsl:with-param name="omitLabel" select="false()" />
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</li>
	<xsl:if test="contains($properties, ',')">
		<xsl:apply-templates select="." mode="selectedProperties">
			<xsl:with-param name="properties" select="substring-after($properties, ',')" />
			<xsl:with-param name="previousProperties" select="concat($previousProperties, ',', $property)" />
		</xsl:apply-templates>
	</xsl:if>
</xsl:template>

<xsl:template match="primaryTopicOf" mode="propertiesentry" />
<xsl:template match="wasResultOf" mode="propertiesentry" />

<xsl:template match="*" mode="propertiesentry">
	<xsl:param name="properties" />
	<xsl:param name="parentName" select="''" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="propertyName">
		<xsl:if test="$parentName != ''">
			<xsl:value-of select="$parentName" />
			<xsl:text>.</xsl:text>
		</xsl:if>
		<xsl:value-of select="name(.)" />
	</xsl:variable>
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasNonLabelProperties = 'true'">
			<xsl:for-each select="key('properties', $propertyName)/*[name() != 'item' and generate-id(key('properties', concat($propertyName, '.', name(.)))[1]) = generate-id(.)] |
				key('properties', concat($propertyName, '.item'))/*[generate-id(key('properties', concat($propertyName, '.item.', name(.)))[1]) = generate-id(.)]">
				<xsl:sort select="name(.) = $easting" order="descending" />
				<xsl:sort select="name(.) = $northing" order="descending" />
				<xsl:sort select="name(.) = $lat" order="descending" />
				<xsl:sort select="name(.) = $long" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="propertiesentry">
					<xsl:with-param name="properties" select="$properties" />
					<xsl:with-param name="parentName" select="$propertyName" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="properties">
				<xsl:with-param name="properties" select="$properties" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="properties">
	<xsl:param name="properties" />
	<xsl:variable name="name">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:if test="not(contains(concat(',', $properties, ','), concat(',', $name, ',')))">
		<li>
			<a rel="nofollow" title="always include this property">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri" select="/result/@href" />
						<xsl:with-param name="param" select="'_properties'" />
						<xsl:with-param name="value">
							<xsl:if test="$properties != ''">
								<xsl:value-of select="$properties" />
								<xsl:text>,</xsl:text>
							</xsl:if>
							<xsl:value-of select="$name" />
						</xsl:with-param> 
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$inactiveImageBase}/Star.png" alt="star this property" />
				<xsl:text> </xsl:text>
				<xsl:apply-templates select="." mode="contextLabel" />
			</a>
		</li>
	</xsl:if>
</xsl:template>

<xsl:template match="result" mode="sizenav">
	<section class="size">
		<h1>Items per page</h1>
		<xsl:call-template name="createInfo">
			<xsl:with-param name="text">Choose how many items to view on each page. The more items you view, the longer the page will take to load.</xsl:with-param>
		</xsl:call-template>
		<ul>
			<li>
				<xsl:apply-templates select="." mode="pageSize">
					<xsl:with-param name="size" select="10" />
				</xsl:apply-templates>
			</li>
			<li>
				<xsl:apply-templates select="." mode="pageSize">
					<xsl:with-param name="size" select="25" />
				</xsl:apply-templates>
			</li>
			<li>
				<xsl:apply-templates select="." mode="pageSize">
					<xsl:with-param name="size" select="50" />
				</xsl:apply-templates>
			</li>
		</ul>
	</section>
</xsl:template>

<xsl:template match="result" mode="pageSize">
	<xsl:param name="size" />
	<xsl:variable name="current" select="itemsPerPage" />
	<xsl:choose>
		<xsl:when test="$size = $current">
			<span class="current">
				<xsl:value-of select="$size" />
			</span>
		</xsl:when>
		<xsl:otherwise>
			<a rel="nofollow" title="view {$size} items per page">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="'_pageSize'" />
						<xsl:with-param name="value" select="$size" />
					</xsl:call-template>
				</xsl:attribute>
				<xsl:value-of select="$size" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="sortnav">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="searchURI">
		<xsl:apply-templates select="/result" mode="searchURI" />
	</xsl:variable>
	<xsl:variable name="current">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="$searchURI" />
			<xsl:with-param name="param" select="'_sort'" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="orderBy">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="$searchURI" />
			<xsl:with-param name="param" select="'_orderBy'" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="baseURI">
		<xsl:call-template name="substituteParam">
			<xsl:with-param name="uri" select="$searchURI" />
			<xsl:with-param name="param" select="'_orderBy'" />
			<xsl:with-param name="value" select="''" />
		</xsl:call-template>
	</xsl:variable>
	<section class="sort">
		<h1>Sort by</h1>
		<xsl:call-template name="createInfo">
			<xsl:with-param name="text">
				<xsl:text>This list shows the properties that you can sort by. Click on </xsl:text>
				<img src="{$inactiveImageBase}/Arrow3 Up.png" alt="sort in ascending order" />
				<xsl:text> to sort in ascending order and </xsl:text>
				<img src="{$inactiveImageBase}/Arrow3 Down.png" alt="sort in descending order" />
				<xsl:text> to sort in descending order. The properties that you're currently sorting by are shown at the top of the list. Click on </xsl:text>
				<img src="{$activeImageBase}/Cancel.png" alt="remove this sort" />
				<xsl:text> to remove a sort and </xsl:text>
				<img src="{$activeImageBase}/Arrow3 Up.png" alt="sort in descending order" />
				<xsl:text> or </xsl:text>
				<img src="{$activeImageBase}/Arrow3 Down.png" alt="sort in ascending order" />
				<xsl:text> to reverse the current sort order. </xsl:text>
				<xsl:text>Click on the </xsl:text>
				<img src="{$activeImageBase}/Back.png" alt="remove all sorting" />
				<xsl:text> icon to remove all the sorting. </xsl:text>
				<xsl:text>Note that sorting can significantly slow down the loading of the page.</xsl:text>
			</xsl:with-param>
		</xsl:call-template>
		<xsl:if test="$current != ''">
			<p class="reset">
				<a title="remove sorting">
					<xsl:attribute name="href">
						<xsl:call-template name="substituteParam">
							<xsl:with-param name="uri" select="$baseURI" />
							<xsl:with-param name="param" select="'_sort'" />
							<xsl:with-param name="value" select="''" />
						</xsl:call-template>
					</xsl:attribute>
					<img src="{$activeImageBase}/Back.png" alt="reset" />
				</a>
			</p>
		</xsl:if>
		<ul>
			<xsl:choose>
				<xsl:when test="$orderBy != ''">
					<xsl:variable name="description">
						<xsl:choose>
							<xsl:when test="starts-with($orderBy, concat('(((?', $easting, ' - ')) or starts-with($orderBy, concat('desc(((?', $easting, ' - '))"> proximity to centre of map</xsl:when>
							<xsl:otherwise> custom sort</xsl:otherwise>
						</xsl:choose>
					</xsl:variable>
					<li class="selected">
						<a rel="nofollow" title="remove this sort" href="{$baseURI}">
							<img src="{$activeImageBase}/Cancel.png" alt="remove this sort" />
						</a>
						<xsl:choose>
							<!-- this is the _orderBy that's used to sort by proximity to center of the map -->
							<xsl:when test="starts-with($orderBy, 'desc')">
								<a rel="nofollow" title="sort in ascending order">
									<xsl:attribute name="href">
										<xsl:call-template name="substituteParam">
											<xsl:with-param name="uri" select="$baseURI" />
											<xsl:with-param name="param" select="'_orderBy'" />
											<xsl:with-param name="value" select="substring-after($orderBy, 'desc')" />
										</xsl:call-template>
									</xsl:attribute>
									<img src="{$activeImageBase}/Arrow3 Down.png" alt="sort in ascending order" />
								</a>
								<xsl:value-of select="$description" />
							</xsl:when>
							<xsl:when test="starts-with($orderBy, 'asc')">
								<a rel="nofollow" title="sort in descending order">
									<xsl:attribute name="href">
										<xsl:call-template name="substituteParam">
											<xsl:with-param name="uri" select="$baseURI" />
											<xsl:with-param name="param" select="'_orderBy'" />
											<xsl:with-param name="value" select="concat('desc', substring-after($orderBy, 'asc'))" />
										</xsl:call-template>
									</xsl:attribute>
									<img src="{$activeImageBase}/Arrow3 Up.png" alt="sort in descending order" />
								</a>
								<xsl:value-of select="$description" />
							</xsl:when>
							<xsl:otherwise>
								<a rel="nofollow" title="sort in descending order">
									<xsl:attribute name="href">
										<xsl:call-template name="substituteParam">
											<xsl:with-param name="uri" select="$baseURI" />
											<xsl:with-param name="param" select="'_orderBy'" />
											<xsl:with-param name="value" select="concat('desc', $orderBy)" />
										</xsl:call-template>
									</xsl:attribute>
									<img src="{$activeImageBase}/Arrow3 Up.png" alt="sort in descending order" />
								</a>
								<xsl:value-of select="$description" />
							</xsl:otherwise>
						</xsl:choose>
					</li>
				</xsl:when>
				<xsl:when test="$current != ''">
					<xsl:apply-templates select="." mode="selectedSorts">
						<xsl:with-param name="uri" select="$baseURI" />
						<xsl:with-param name="sorts" select="$current" />
					</xsl:apply-templates>
				</xsl:when>
			</xsl:choose>
			<xsl:for-each select="items/item/*[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
				<xsl:sort select="name(.) = $prefLabel" order="descending" />
				<xsl:sort select="name(.) = $name" order="descending" />
				<xsl:sort select="name(.) = $title" order="descending" />
				<xsl:sort select="name(.) = $label" order="descending" />
				<xsl:sort select="name(.) = $altLabel" order="descending" />
				<xsl:sort select="name(.) = $easting" order="descending" />
				<xsl:sort select="name(.) = $northing" order="descending" />
				<xsl:sort select="name(.) = $lat" order="descending" />
				<xsl:sort select="name(.) = $long" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="sortentry">
					<xsl:with-param name="uri" select="$baseURI" />
					<xsl:with-param name="current" select="$current" />
				</xsl:apply-templates>
			</xsl:for-each>
		</ul>
	</section>
</xsl:template>

<xsl:template match="result" mode="selectedSorts">
	<xsl:param name="uri" />
	<xsl:param name="sorts" />
	<xsl:param name="previousSorts" select="''" />
	<xsl:variable name="sort" select="substring-before(concat($sorts, ','), ',')" />
	<xsl:variable name="paramName">
		<xsl:choose>
			<xsl:when test="starts-with($sort, '-')">
				<xsl:value-of select="substring($sort, 2)" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$sort" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="isLabelParam">
		<xsl:call-template name="isLabelParam">
			<xsl:with-param name="paramName" select="$paramName" />
		</xsl:call-template>
	</xsl:variable>
	<li class="selected">
		<a rel="nofollow" title="remove this sort">
			<xsl:attribute name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri" select="$uri" />
					<xsl:with-param name="param" select="'_sort'" />
					<xsl:with-param name="value">
						<xsl:if test="$previousSorts != ''">
							<xsl:value-of select="$previousSorts" />
							<xsl:text>,</xsl:text>
						</xsl:if>
						<xsl:value-of select="substring-after($sorts, ',')" />
					</xsl:with-param> 
				</xsl:call-template>
			</xsl:attribute>
			<img src="{$activeImageBase}/Cancel.png" alt="remove this sort" />
		</a>
		<a rel="nofollow">
			<xsl:attribute name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri" select="$uri" />
					<xsl:with-param name="param" select="'_sort'" />
					<xsl:with-param name="value">
						<xsl:if test="$previousSorts != ''">
							<xsl:value-of select="$previousSorts" />
							<xsl:text>,</xsl:text>
						</xsl:if>
						<xsl:choose>
							<xsl:when test="starts-with($sort, '-')">
								<xsl:value-of select="substring($sort, 2)" />
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="concat('-', $sort)" />
							</xsl:otherwise>
						</xsl:choose>
					</xsl:with-param> 
				</xsl:call-template>
			</xsl:attribute>
			<xsl:attribute name="title">
				<xsl:choose>
					<xsl:when test="starts-with($sort, '-')">sort in ascending order</xsl:when>
					<xsl:otherwise>sort in descending order</xsl:otherwise>
				</xsl:choose>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="starts-with($sort, '-')">
					<img src="{$activeImageBase}/Arrow3 Down.png" alt="sort in ascending order" />
				</xsl:when>
				<xsl:otherwise>
					<img src="{$activeImageBase}/Arrow3 Up.png" alt="sort in descending order" />
				</xsl:otherwise>
			</xsl:choose>
		</a>
		<xsl:text> </xsl:text>
		<xsl:choose>
			<xsl:when test="$isLabelParam = 'true'">
				<xsl:value-of select="$paramName" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="splitPath">
					<xsl:with-param name="paramName" select="$paramName" />
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</li>
	<xsl:if test="contains($sorts, ',')">
		<xsl:apply-templates select="." mode="selectedSorts">
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="sorts" select="substring-after($sorts, ',')" />
			<xsl:with-param name="previousSorts" select="concat($previousSorts, ',', $sort)" />
		</xsl:apply-templates>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="sortentry">
	<xsl:param name="uri" />
	<xsl:param name="current" />
	<xsl:param name="parentName" select="''" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="propertyName">
		<xsl:if test="$parentName != ''">
			<xsl:value-of select="$parentName" />
			<xsl:text>.</xsl:text>
		</xsl:if>
		<xsl:value-of select="name()" />
	</xsl:variable>
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasNonLabelProperties = 'true'">
			<xsl:for-each select="key('properties', $propertyName)/*[name() != 'item' and generate-id(key('properties', concat($propertyName, '.', name(.)))[1]) = generate-id(.)] |
				key('properties', concat($propertyName, '.item'))/*[generate-id(key('properties', concat($propertyName, '.item.', name(.)))[1]) = generate-id(.)]">
				<xsl:sort select="name(.) = $easting" order="descending" />
				<xsl:sort select="name(.) = $northing" order="descending" />
				<xsl:sort select="name(.) = $lat" order="descending" />
				<xsl:sort select="name(.) = $long" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="sortentry">
					<xsl:with-param name="uri" select="$uri" />
					<xsl:with-param name="current" select="$current" />
					<xsl:with-param name="parentName" select="$propertyName" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="sort">
				<xsl:with-param name="uri" select="$uri" />
				<xsl:with-param name="current" select="$current" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="sort">
	<xsl:param name="uri" />
	<xsl:param name="current" />
	<xsl:variable name="name">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:if test="not(contains(concat(',', $current, ','), concat(',', $name, ',')) or contains(concat(',', $current, ','), concat(',-', $name, ',')))">
		<xsl:variable name="ascending">
			<xsl:call-template name="substituteParam">
				<xsl:with-param name="uri" select="$uri" />
				<xsl:with-param name="param" select="'_sort'" />
				<xsl:with-param name="value">
					<xsl:if test="$current != ''">
						<xsl:value-of select="$current" />
						<xsl:text>,</xsl:text>
					</xsl:if>
					<xsl:value-of select="$name" />
				</xsl:with-param> 
			</xsl:call-template>
		</xsl:variable>
		<li>
			<a rel="nofollow" href="{$ascending}" title="sort in ascending order">
				<img src="{$inactiveImageBase}/Arrow3 Up.png" alt="sort in ascending order" />
			</a>
			<a rel="nofollow" title="sort in descending order">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri" select="$uri" />
						<xsl:with-param name="param" select="'_sort'" />
						<xsl:with-param name="value">
							<xsl:if test="$current != ''">
								<xsl:value-of select="$current" />
								<xsl:text>,</xsl:text>
							</xsl:if>
							<xsl:text>-</xsl:text>
							<xsl:value-of select="$name" />
						</xsl:with-param>
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$inactiveImageBase}/Arrow3 Down.png" alt="sort in descending order" />
			</a>
			<xsl:text> </xsl:text>
			<a rel="nofollow" href="{$ascending}" title="sort in ascending order">
				<xsl:apply-templates select="." mode="contextLabel" />
			</a>
		</li>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="paramHierarchy">
	<xsl:if test="not(parent::item/parent::items/parent::result or parent::primaryTopic/parent::result)">
		<xsl:apply-templates select="parent::*" mode="paramHierarchy" />
		<xsl:if test="not(self::item)">.</xsl:if>
	</xsl:if>
	<xsl:if test="not(self::item)">
		<xsl:value-of select="name(.)" />
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="paramName">
	<xsl:variable name="bestLabelParam">
		<xsl:apply-templates select="." mode="bestLabelParam" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="item"><xsl:apply-templates select="item[1]" mode="paramName" /></xsl:when>
		<xsl:when test="$bestLabelParam != ''">
			<xsl:apply-templates select="*[name() = $bestLabelParam]" mode="paramHierarchy" />
		</xsl:when>
		<xsl:otherwise><xsl:apply-templates select="." mode="paramHierarchy" /></xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template match="result" mode="bottomnav">
	<nav class="bottomnav">
		<xsl:apply-templates select="." mode="pagenav" />
	</nav>
</xsl:template>

<xsl:template match="result" mode="pagenav">
	<xsl:if test="prev or next">
		<section class="page">
			<ul>
				<xsl:for-each select="first | prev | next | last">
					<xsl:sort select="boolean(self::last)" />
					<xsl:sort select="boolean(self::next)" />
					<xsl:sort select="boolean(self::prev)" />
					<li><xsl:apply-templates select="." mode="nav" /></li>
				</xsl:for-each>
			</ul>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template match="first | prev | next | last" mode="nav">
	<a href="{@href}" title="go to {name()} page">
		<xsl:choose>
			<xsl:when test="self::first">« </xsl:when>
			<xsl:when test="self::prev">‹ </xsl:when>
		</xsl:choose>
		<xsl:value-of select="name()" />
		<xsl:choose>
			<xsl:when test="self::next"> ›</xsl:when>
			<xsl:when test="self::last"> »</xsl:when>
		</xsl:choose>
	</a>
</xsl:template>

<xsl:template match="format/item" mode="nav">
	<xsl:variable name="name">
		<xsl:apply-templates select="." mode="name" />
	</xsl:variable>
	<a href="{@href}" type="{format/label}" rel="alternate" title="view in {$name} format">
		<xsl:value-of select="label" />
	</a>
</xsl:template>

<xsl:template match="version/item | version[not(item)]" mode="nav">
	<xsl:param name="current" />
	<xsl:variable name="label">
		<xsl:choose>
			<xsl:when test="label != ''">
				<xsl:value-of select="label" />
			</xsl:when>
			<xsl:otherwise>default</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$current = label">
			<span class="current">
				<xsl:value-of select="$label" />
			</span>
		</xsl:when>
		<xsl:otherwise>
			<a href="{@href}" title="switch to {$label} view">
				<xsl:value-of select="$label" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="/result/primaryTopic" mode="content" priority="10">
	<header>
		<p id="openSearch">Show Search Form</p>
		<h1><xsl:apply-templates select="." mode="name" /></h1>
		<p class="id"><a href="{@href}"><xsl:value-of select="@href" /></a></p>
	</header>
	<xsl:apply-templates select="/result" mode="search" />
	<section>
		<xsl:apply-templates select="." mode="header" />
		<xsl:apply-templates select="." mode="table" />
		<xsl:apply-templates select="." mode="footer" />
	</section>
</xsl:template>

<xsl:template match="items" mode="content" priority="10">
	<xsl:choose>
		<xsl:when test="item[@href]">
			<xsl:apply-templates mode="section" />
		</xsl:when>
		<xsl:otherwise>
			<section>
				<p>No results</p>
			</section>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="item" mode="section">
	<section id="{generate-id(.)}">
		<xsl:apply-templates select="." mode="header" />
		<xsl:apply-templates select="." mode="content" />
		<xsl:apply-templates select="." mode="footer" />
	</section>
</xsl:template>

<xsl:template match="items/item" mode="header">
</xsl:template>

<xsl:template match="items/item" mode="content" priority="20">
	<xsl:apply-templates select="." mode="table" />
</xsl:template>

<xsl:template match="item" mode="listitem">
	<li>
		<xsl:choose>
			<xsl:when test="@href">
				<xsl:apply-templates select="." mode="link">
					<xsl:with-param name="content">
						<xsl:apply-templates select="." mode="name" />
					</xsl:with-param>
				</xsl:apply-templates>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="." mode="display" />
			</xsl:otherwise>
		</xsl:choose>
	</li>
</xsl:template>

<xsl:template match="*" mode="map">
	<xsl:variable name="id" select="concat('map', generate-id(.))" />
	<div class="mapWrapper">
		<div id="{$id}" class="itemMap">
		</div>
	</div>
</xsl:template>

<xsl:template match="*" mode="table">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="showMap">
		<xsl:apply-templates select="." mode="showMap" />
	</xsl:variable>
	<xsl:variable name="properties">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="/result/@href" />
			<xsl:with-param name="param" select="'_properties'" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="bestLabelParam">
		<xsl:apply-templates select="." mode="bestLabelParam" />
	</xsl:variable>
	<table id="{generate-id(.)}">
		<xsl:choose>
			<xsl:when test="self::primaryTopic/parent::result" />
			<xsl:when test="$bestLabelParam != ''">
				<xsl:apply-templates select="*[name() = $bestLabelParam]" mode="caption" />
			</xsl:when>
			<xsl:when test="@href and not(starts-with(@href, 'http://api.talis.com'))">
				<caption>
					<xsl:apply-templates select="." mode="link">
						<xsl:with-param name="content">
							<xsl:choose>
								<xsl:when test="self::item/parent::items/parent::result or starts-with(@href, ancestor::*[@href][1]/@href)">
									<xsl:call-template name="lastURIpart">
										<xsl:with-param name="uri" select="@href" />
									</xsl:call-template>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="@href" />
								</xsl:otherwise>
							</xsl:choose>
						</xsl:with-param>
					</xsl:apply-templates>
				</caption>
			</xsl:when>
		</xsl:choose>
		<colgroup>
			<xsl:if test="$properties != ''">
				<col width="20" />
			</xsl:if>
			<col width="25%" />
			<col width="*" />
			<xsl:if test="$showMap = 'true'">
				<col width="47" />
			</xsl:if>
			<col width="54" />
		</colgroup>
		<!-- This for-each is a hack around what seems to be a bug in older versions
			of libxslt, which ignores ordering in an xsl:apply-templates -->
		<xsl:for-each select="*">
			<xsl:sort select="name(.) = $easting" order="descending" />
			<xsl:sort select="name(.) = $northing" order="descending" />
			<xsl:sort select="name(.) = $lat" order="descending" />
			<xsl:sort select="name(.) = $long" order="descending" />
			<xsl:sort select="name(.) = $prefLabel" order="descending" />
			<xsl:sort select="name(.) = $name" order="descending" />
			<xsl:sort select="name(.) = $title" order="descending" />
			<xsl:sort select="name(.) = $label" order="descending" />
			<xsl:sort select="name(.) = $altLabel" order="descending" />
			<xsl:sort select="boolean(@datatype)" order="descending" />
			<xsl:sort select="@datatype" />
			<xsl:sort select="boolean(@href)" />
			<xsl:sort select="local-name()" />
			<xsl:apply-templates select="." mode="row">
				<xsl:with-param name="showMap" select="$showMap" />
				<xsl:with-param name="properties" select="$properties" />
				<xsl:with-param name="bestLabelParam" select="$bestLabelParam" />
				<xsl:with-param name="last" select="position() = last()" />
			</xsl:apply-templates>
		</xsl:for-each>
	</table>
</xsl:template>
	
<xsl:template match="*" mode="caption">
	<caption>
		<xsl:apply-templates select=".." mode="link">
			<xsl:with-param name="content">
				<xsl:choose>
					<xsl:when test="item">
						<xsl:for-each select="item[not(. = preceding-sibling::item)]">
							<xsl:sort select="@xml:lang = 'en'" order="descending" />
							<xsl:sort select="@xml:lang" />
							<xsl:value-of select="." />
							<xsl:if test="position() != last()"> / </xsl:if>
						</xsl:for-each>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="." />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:with-param>
		</xsl:apply-templates>
	</caption>
</xsl:template>

<xsl:template match="item" mode="row">
	<xsl:param name="last" />
	<tr>
		<xsl:if test="$last">
			<xsl:attribute name="class">last</xsl:attribute>
		</xsl:if>
		<td class="value">
			<xsl:apply-templates select="." mode="display" />
		</td>
		<td class="filter">
			<xsl:apply-templates select="." mode="filter" />
		</td>
	</tr>
</xsl:template>

<xsl:template match="primaryTopicOf[@href = /result/@href or (count(item) = 1 and item/@href = /result/@href)]" mode="row" />
<xsl:template match="wasResultOf" mode="row" />

<xsl:template match="*" mode="row">
	<xsl:param name="showMap" />
	<xsl:param name="properties" />
	<xsl:param name="bestLabelParam" />
	<xsl:param name="last" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="paramName">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:if test="name() != $bestLabelParam">
		<xsl:variable name="hasNonLabelProperties">
			<xsl:apply-templates select="." mode="hasNonLabelProperties" />
		</xsl:variable>
		<xsl:variable name="hasNoLabelProperties">
			<xsl:apply-templates select="." mode="hasNoLabelProperties" />
		</xsl:variable>
		<tr class="{name(.)}">
			<xsl:if test="$last">
				<xsl:attribute name="class"><xsl:value-of select="name(.)"/> last</xsl:attribute>
			</xsl:if>
			<xsl:if test="$properties != ''">
				<td class="select">
					<xsl:apply-templates select="." mode="select">
						<xsl:with-param name="paramName" select="$paramName" />
						<xsl:with-param name="properties" select="$properties" />
					</xsl:apply-templates>
				</td>
			</xsl:if>
			<th class="label">
				<xsl:apply-templates select="." mode="label">
					<xsl:with-param name="addLink" select="true()" />
				</xsl:apply-templates>
			</th>
			<xsl:choose>
				<xsl:when test="name(.) = $easting and $showMap = 'true'">
					<td class="value">
						<xsl:apply-templates select="." mode="display" />
					</td>
					<td class="map" colspan="2">
						<xsl:choose>
							<xsl:when test="../*[name(.) = $lat] and ../*[name(.) = $long]">
								<xsl:attribute name="rowspan">4</xsl:attribute>
							</xsl:when>
							<xsl:otherwise>
								<xsl:attribute name="rowspan">2</xsl:attribute>
							</xsl:otherwise>
						</xsl:choose>
						<xsl:apply-templates select="parent::*" mode="map" />
					</td>
				</xsl:when>
				<xsl:when test="(name(.) = $northing or name(.) = $lat or name(.) = $long) and $showMap = 'true'">
					<td class="value">
						<xsl:apply-templates select="." mode="display" />
					</td>
				</xsl:when>
				<xsl:when test="$hasNonLabelProperties = 'true' or item">
					<td class="value nested">
						<xsl:attribute name="colspan">
							<xsl:choose>
								<xsl:when test="$showMap = 'true'">3</xsl:when>
								<xsl:otherwise>2</xsl:otherwise>
							</xsl:choose>
						</xsl:attribute>
						<xsl:apply-templates select="." mode="display">
							<xsl:with-param name="nested" select="true()" />
						</xsl:apply-templates>
					</td>
				</xsl:when>
				<xsl:otherwise>
					<td class="value">
						<xsl:if test="$showMap = 'true'">
							<xsl:attribute name="colspan">2</xsl:attribute>
						</xsl:if>
						<xsl:apply-templates select="." mode="display" />
					</td>
					<td class="filter">
						<xsl:apply-templates select="." mode="filter">
							<xsl:with-param name="paramName" select="$paramName" />
						</xsl:apply-templates>
					</td>
				</xsl:otherwise>
			</xsl:choose>
		</tr>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="contextLabel">
	<xsl:if test="not(parent::item/parent::items/parent::result or parent::primaryTopic/parent::result)">
		<xsl:apply-templates select="parent::*" mode="contextLabel" />
		<xsl:if test="not(self::item)"><xsl:text> › </xsl:text></xsl:if>
	</xsl:if>
	<xsl:if test="not(self::item)">
		<xsl:apply-templates select="." mode="label" />
	</xsl:if>
</xsl:template>

<xsl:template name="createInfo">
	<xsl:param name="text" />
	<div class="info">
		<img class="open" src="{$activeImageBase}/Question.png" alt="help" />
		<p><xsl:copy-of select="$text" /></p>
	</div>
</xsl:template>

<xsl:template name="splitPath">
	<xsl:param name="paramName" />
	<xsl:param name="omitLabel" select="true()" />
	<xsl:variable name="isLabelParam">
		<xsl:call-template name="isLabelParam">
			<xsl:with-param name="paramName" select="$paramName" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="contains($paramName, '-')">
			<xsl:value-of select="substring-before($paramName, '-')" />
			<xsl:text> </xsl:text>
			<xsl:call-template name="splitPath">
				<xsl:with-param name="paramName" select="substring-after($paramName, '-')" />
				<xsl:with-param name="omitLabel" select="$omitLabel" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="contains($paramName, '.')">
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="substring-before($paramName, '.')" />
			</xsl:call-template>
			<xsl:variable name="rest">
				<xsl:call-template name="splitPath">
					<xsl:with-param name="paramName" select="substring-after($paramName, '.')" />
					<xsl:with-param name="omitLabel" select="$omitLabel" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:if test="string($rest) != ''">
				<xsl:text> › </xsl:text>
				<xsl:copy-of select="$rest" />
			</xsl:if>
		</xsl:when>
		<xsl:when test="$omitLabel and $isLabelParam = 'true'" />
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$paramName" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="value">
	<xsl:variable name="hasLabelProperty">
		<xsl:apply-templates select="." mode="hasLabelProperty" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasLabelProperty = 'true'">
			<xsl:variable name="bestLabelParam">
				<xsl:apply-templates select="." mode="bestLabelParam" />
			</xsl:variable>
			<xsl:variable name="bestLabel" select="*[name() = $bestLabelParam]" />
			<xsl:choose>
				<xsl:when test="$bestLabel/item">
					<xsl:value-of select="$bestLabel/item[1]" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$bestLabel" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template match="*[@datatype = 'boolean']" mode="display">
	<xsl:choose>
		<xsl:when test=". = 'true'">
			<img src="{$inactiveImageBase}/Ok.png" alt="true" />
		</xsl:when>
		<xsl:when test=". = 'false'">
			<img src="{$inactiveImageBase}/Cancel.png" alt="false" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="content" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[@datatype = 'date' or @datatype = 'dateTime' or @datatype = 'time']" mode="display">
	<time datetime="{.}">
		<xsl:choose>
			<xsl:when test="@datatype = 'date' or @datatype = 'dateTime'">
				<xsl:value-of select="substring(., 9, 2)" />
				<xsl:text>/</xsl:text>
				<xsl:value-of select="substring(., 6, 2)" />
				<xsl:text>/</xsl:text>
				<xsl:value-of select="substring(., 1, 4)" />
				<xsl:if test="@datatype = 'dateTime'">
					<xsl:text> </xsl:text>
					<xsl:value-of select="substring(substring-after(., 'T'), 1, 8)" />
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="." mode="content" />
			</xsl:otherwise>
		</xsl:choose>
	</time>
</xsl:template>

<xsl:template match="*[@datatype = 'integer' or @datatype = 'decimal' or @datatype = 'int' or @datatype = 'float' or @datatype = 'double']" mode="display">
	<xsl:apply-templates select="." mode="content" />
	<xsl:if test="not(/result/next) and not(self::item)">
		<xsl:variable name="path">
			<xsl:apply-templates select="." mode="nodePath" />
		</xsl:variable>
		<xsl:variable name="allValues" select="key('properties', $path)" />
		<xsl:variable name="showBoxplot">
			<xsl:apply-templates select="." mode="showBoxplot">
				<xsl:with-param name="values" select="$allValues" />
			</xsl:apply-templates>
		</xsl:variable>
		<xsl:if test="$showBoxplot = 'true'">
			<span class="boxplot" id="boxplot{generate-id()}">
			</span>
			<script type="text/javascript">
				$('#boxplot<xsl:value-of select="generate-id()"/>').sparkline([
					<xsl:for-each select="$allValues">
						<xsl:value-of select="." />
						<xsl:if test="position() != last()">,</xsl:if>
					</xsl:for-each>],
					{
						type: 'box',
						showOutliers: false,
						lineColor: '#555555',
						boxLineColor: '#555555',
						boxFillColor: '#EBEBEB',
						whiskerColor: '#555555',
						outlierLineColor: '#555555',
						outlierFillColor: '#EBEBEB',
						medianColor: '#555555',
						target: <xsl:value-of select="." />,
						targetColor: '<xsl:value-of select="$graphColour"/>'
					}
				)
			</script>
		</xsl:if>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="showBoxplot">
	<xsl:param name="values" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:choose>
		<xsl:when test="name(.) = $easting or name(.) = $northing or name(.) = $lat or name(.) = $long" />
		<xsl:otherwise>
			<xsl:variable name="distinctValues">
				<xsl:call-template name="numberDistinctValues">
					<xsl:with-param name="values" select="$values" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:value-of select="$distinctValues != 1 and count($values) > 5 and not($values/item)" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="/result/items/item | /result/primaryTopic" mode="nodePath" />
<xsl:template match="*" mode="nodePath">
	<xsl:if test="not(parent::item/parent::items/parent::result or parent::primaryTopic/parent::result)">
		<xsl:apply-templates select="parent::*" mode="nodePath" />
		<xsl:text>.</xsl:text>
	</xsl:if>
	<xsl:value-of select="name()" />
</xsl:template>

<xsl:template match="*" mode="display">
	<xsl:param name="nested" select="false()" />
	<xsl:apply-templates select="." mode="content">
		<xsl:with-param name="nested" select="$nested" />
	</xsl:apply-templates>
</xsl:template>

<xsl:template match="*[item]" mode="content" priority="4">
	<xsl:param name="nested" select="false()" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="isLabelParam">
		<xsl:apply-templates select="." mode="isLabelParam" />
	</xsl:variable>
	<xsl:variable name="anyItemHasNonLabelProperties">
		<xsl:apply-templates select="." mode="anyItemHasNonLabelProperties" />
	</xsl:variable>
	<xsl:variable name="anyItemIsHighestDescription">
		<xsl:apply-templates select="." mode="anyItemIsHighestDescription" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$anyItemHasNonLabelProperties = 'true' and $anyItemIsHighestDescription = 'true'">
			<xsl:for-each select="item">
				<xsl:sort select="*[name(.) = $prefLabel]" />
				<xsl:sort select="*[name(.) = $name]" />
				<xsl:sort select="*[name(.) = $title]" />
				<xsl:sort select="*[name(.) = $label]" />
				<xsl:sort select="*[name(.) = $altLabel]" />
				<xsl:sort select="*[name(.) = $easting]" order="descending" />
				<xsl:sort select="*[name(.) = $northing]" order="descending" />
				<xsl:sort select="*[name(.) = $lat]" order="descending" />
				<xsl:sort select="*[name(.) = $long]" order="descending" />
				<xsl:sort select="@href" />
				<xsl:apply-templates select="." mode="content">
					<xsl:with-param name="nested" select="$nested" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
			<table>
				<xsl:for-each select="item">
					<xsl:sort select="*[name(.) = $prefLabel]" />
					<xsl:sort select="*[name(.) = $name]" />
					<xsl:sort select="*[name(.) = $title]" />
					<xsl:sort select="*[name(.) = $label]" />
					<xsl:sort select="*[name(.) = $altLabel]" />
					<xsl:sort select="*[name(.) = $easting]" order="descending" />
					<xsl:sort select="*[name(.) = $northing]" order="descending" />
					<xsl:sort select="*[name(.) = $lat]" order="descending" />
					<xsl:sort select="*[name(.) = $long]" order="descending" />
					<xsl:sort select="@href" />
					<xsl:apply-templates select="." mode="row" />
				</xsl:for-each>
			</table>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[*]" mode="content" priority="3">
	<xsl:param name="nested" select="false()" />
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:variable name="isHighestDescription">
		<xsl:apply-templates select="." mode="isHighestDescription" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$nested or ($hasNonLabelProperties = 'true' and $isHighestDescription = 'true')">
			<xsl:apply-templates select="." mode="table" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="link">
				<xsl:with-param name="content">
					<xsl:apply-templates select="." mode="name" />
				</xsl:with-param>
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[@href]" mode="content">
	<xsl:param name="nested" select="false()" />
	<xsl:choose>
		<xsl:when test="$nested">
			<xsl:apply-templates select="." mode="table" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="link">
				<xsl:with-param name="content">
					<xsl:call-template name="lastURIpart">
						<xsl:with-param name="uri" select="@href" />
					</xsl:call-template>
				</xsl:with-param>
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="content">
	<xsl:value-of select="." />
</xsl:template>

<xsl:template match="*" mode="select">
	<xsl:param name="paramName" />
	<xsl:param name="properties" />
	<xsl:variable name="normalisedProperties" select="concat(',', $properties, ',')" />
	<xsl:variable name="entry" select="concat(',', $paramName, ',')" />
	<xsl:choose>
		<xsl:when test="contains($normalisedProperties, $entry)">
			<xsl:variable name="before" select="substring-before($normalisedProperties, $entry)" />
			<xsl:variable name="after" select="substring-after($normalisedProperties, $entry)" />
			<xsl:variable name="value">
				<xsl:value-of select="substring($before, 2)" />
				<xsl:if test="not($before = ',' or $before = '') and not($after = ',' or $after = '')">,</xsl:if>
				<xsl:value-of select="substring($after, 1, string-length($after) - 1)" />
			</xsl:variable>
			<xsl:variable name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri" select="/result/@href" />
					<xsl:with-param name="param" select="'_properties'" />
					<xsl:with-param name="value">
						<xsl:value-of select="substring($before, 2)" />
						<xsl:if test="not($before = ',' or $before = '') and not($after = ',' or $after = '')">,</xsl:if>
						<xsl:value-of select="substring($after, 1, string-length($after) - 1)" />
					</xsl:with-param>
				</xsl:call-template>
			</xsl:variable>
			<a rel="nofollow" title="remove this property" href="{$href}">
				<img src="{$activeImageBase}/Star.png" alt="unstar this property" />
			</a>
		</xsl:when>
		<xsl:otherwise>
			<a rel="nofollow" title="add this property">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri" select="/result/@href" />
						<xsl:with-param name="param" select="'_properties'" />
						<xsl:with-param name="value">
							<xsl:if test="$properties != ''">
								<xsl:value-of select="$properties" />
								<xsl:text>,</xsl:text>
							</xsl:if>
							<xsl:value-of select="$paramName" />
						</xsl:with-param>
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$inactiveImageBase}/Star.png" alt="star this property" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="filter">
	<xsl:param name="paramName">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:param>
	<xsl:param name="value" select="." />
	<xsl:param name="label">
		<xsl:apply-templates select="." mode="value" />
	</xsl:param>
	<xsl:param name="datatype" select="@datatype" />
	<xsl:param name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:param>
	<xsl:param name="hasNoLabelProperties">
		<xsl:apply-templates select="." mode="hasNoLabelProperties" />
	</xsl:param>
	<xsl:variable name="paramValue">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri">
				<xsl:apply-templates select="/result" mode="searchURI" />
			</xsl:with-param>
			<xsl:with-param name="param" select="$paramName" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$value = ''" />
		<xsl:when test="$hasNonLabelProperties = 'true' and $hasNoLabelProperties = 'true'" />
		<xsl:when test="$paramValue = $value">
			<a rel="nofollow" title="remove filter">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="$paramName" />
						<xsl:with-param name="value" select="''" />
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$activeImageBase}/Back.png" alt="remove filter" />
			</a>
		</xsl:when>
		<xsl:when test="$datatype = 'integer' or $datatype = 'decimal' or $datatype = 'float' or $datatype = 'int' or $datatype = 'date' or $datatype = 'dateTime' or $datatype = 'time'">
			<xsl:variable name="min">
				<xsl:call-template name="paramValue">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
					<xsl:with-param name="param" select="concat('min-', $paramName)" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="max">
				<xsl:call-template name="paramValue">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
					<xsl:with-param name="param" select="concat('max-', $paramName)" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="$max = $value">
					<a rel="nofollow" title="remove maximum value filter">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('max-', $paramName)" />
								<xsl:with-param name="value" select="''" />
							</xsl:call-template>
						</xsl:attribute>
						<img src="{$activeImageBase}/Back.png" alt="remove maximum value filter" />
					</a>
				</xsl:when>
				<xsl:otherwise>
					<a rel="nofollow" title="filter to values less than {$value}">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('max-', $paramName)" />
								<xsl:with-param name="value" select="$value" />
							</xsl:call-template>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="$max != ''">
								<img src="{$activeImageBase}/Arrow3 Left.png" alt="less than {$value}" />
							</xsl:when>
							<xsl:otherwise>
								<img src="{$inactiveImageBase}/Arrow3 Left.png" alt="less than {$value}" />
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:otherwise>
			</xsl:choose>
			<a rel="nofollow" title="more like this">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="$paramName" />
						<xsl:with-param name="value" select="$value" />
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$inactiveImageBase}/Search.png" alt="more like this" />
			</a>
			<xsl:choose>
				<xsl:when test="$min = $value">
					<a rel="nofollow" title="remove minimum value filter">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('min-', $paramName)" />
								<xsl:with-param name="value" select="''" />
							</xsl:call-template>
						</xsl:attribute>
						<img src="{$activeImageBase}/Back.png" alt="remove minimum value filter" />
					</a>
				</xsl:when>
				<xsl:otherwise>
					<a rel="nofollow" title="more than {$value}">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('min-', $paramName)" />
								<xsl:with-param name="value" select="$value" />
							</xsl:call-template>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="$min != ''">
								<img src="{$activeImageBase}/Arrow3 Right.png" alt="more than {$value}" />
							</xsl:when>
							<xsl:otherwise>
								<img src="{$inactiveImageBase}/Arrow3 Right.png" alt="more than {$value}" />
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<a rel="nofollow" title="more like this">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="$paramName" />
						<xsl:with-param name="value" select="$label" />
					</xsl:call-template>
				</xsl:attribute>
				<img src="{$inactiveImageBase}/Search.png" alt="more like this" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="link">
	<xsl:param name="content" />
	<xsl:choose>
		<xsl:when test="@href and not(starts-with(@href, 'http://api.talis.com'))">
			<xsl:variable name="highestDescription">
				<xsl:apply-templates select="." mode="highestDescription" />
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="$highestDescription != generate-id(.)">
					<a href="#{$highestDescription}" title="view on this page">
						<xsl:copy-of select="$content" />
					</a>
				</xsl:when>
				<xsl:otherwise>
					<xsl:variable name="adjustedHref">
						<xsl:apply-templates select="@href" mode="uri" />
					</xsl:variable>
					<xsl:choose>
						<xsl:when test="$adjustedHref = @href">
							<a href="{@href}">
								<xsl:choose>
									<xsl:when test="@href = $content">
										<xsl:attribute name="class">outlink</xsl:attribute>
										<xsl:call-template name="lastURIpart">
											<xsl:with-param name="uri" select="@href" />
										</xsl:call-template>
									</xsl:when>
									<xsl:otherwise>
										<xsl:copy-of select="$content" />
									</xsl:otherwise>
								</xsl:choose>
							</a>
						</xsl:when>
						<xsl:otherwise>
							<a href="{$adjustedHref}" title="view on this site">
								<xsl:copy-of select="$content" />
							</a>
							<xsl:if test="$adjustedHref != @href">
								<xsl:text> </xsl:text>
								<a href="{@href}" title="view original" class="outlink">original</a>
							</xsl:if>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$content" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="search">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="searchURI">
		<xsl:apply-templates select="/result" mode="searchURI" />
	</xsl:variable>
	<section id="search">
		<xsl:if test="items/item[@href] or (not(items) and primaryTopic)">
			<form action="{$searchURI}">
				<xsl:call-template name="hiddenInputs">
					<xsl:with-param name="params" select="substring-after($searchURI, '?')" />
				</xsl:call-template>
				<table>
					<colgroup>
						<col width="25%" />
						<col width="70%" />
					</colgroup>
					<xsl:for-each select="(items/item/* | primaryTopic/*)[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
						<xsl:sort select="name(.) = $prefLabel" order="descending" />
						<xsl:sort select="name(.) = $name" order="descending" />
						<xsl:sort select="name(.) = $title" order="descending" />
						<xsl:sort select="name(.) = $label" order="descending" />
						<xsl:sort select="name(.) = $altLabel" order="descending" />
						<xsl:sort select="name(.) = $easting" order="descending" />
						<xsl:sort select="name(.) = $northing" order="descending" />
						<xsl:sort select="name(.) = $lat" order="descending" />
						<xsl:sort select="name(.) = $long" order="descending" />
						<xsl:sort select="boolean(@datatype)" order="descending" />
						<xsl:sort select="@datatype" />
						<xsl:sort select="boolean(@href)" />
						<xsl:sort select="name(.)" />
						<xsl:apply-templates select="." mode="formrow" />
					</xsl:for-each>
				</table>
				<p>
					<button type="submit">Search</button>
				</p>
			</form>
		</xsl:if>
	</section>
</xsl:template>
	
<xsl:template name="hiddenInputs">
	<xsl:param name="params" />
	<xsl:variable name="param">
		<xsl:choose>
			<xsl:when test="contains($params, '&amp;')">
				<xsl:value-of select="substring-before($params, '&amp;')" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$params" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:if test="starts-with($param, '_')">
		<xsl:variable name="paramName" select="substring-before($param, '=')" />
		<xsl:variable name="paramValue" select="substring-after($param, '=')" />
		<input name="{$paramName}" value="{$paramValue}" type="hidden" />
	</xsl:if>
	<xsl:if test="contains($params, '&amp;')">
		<xsl:call-template name="hiddenInputs">
			<xsl:with-param name="params" select="substring-after($params, '&amp;')" />
		</xsl:call-template>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="formrow">
	<xsl:param name="parentName" select="''" />
	<xsl:param name="last" select="false()" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="propertyName">
		<xsl:if test="$parentName != ''">
			<xsl:value-of select="$parentName" />
			<xsl:text>.</xsl:text>
		</xsl:if>
		<xsl:value-of select="name(.)" />
	</xsl:variable>
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasNonLabelProperties = 'true'">
			<!-- there's a child of this kind of property that isn't an empty item element -->
			<xsl:if test="key('properties', $propertyName)/*[name() != 'item' or node()]">
				<tr>
					<xsl:if test="$last">
						<xsl:attribute name="class">last</xsl:attribute>
					</xsl:if>
					<th class="label">
						<xsl:apply-templates select="." mode="label" />
					</th>
					<td class="input nested">
						<table>
							<colgroup>
								<col width="25%" />
								<col width="75%" />
							</colgroup>
							<xsl:for-each 
								select="key('properties', $propertyName)/*[name() != 'item' and generate-id(key('properties', concat($propertyName, '.', name(.)))[1]) = generate-id(.)] | 
								key('properties', concat($propertyName, '.item'))/*[generate-id(key('properties', concat($propertyName, '.item.', name(.)))[1]) = generate-id(.)]">
								<xsl:sort select="name(.) = $easting" order="descending" />
								<xsl:sort select="name(.) = $northing" order="descending" />
								<xsl:sort select="name(.) = $lat" order="descending" />
								<xsl:sort select="name(.) = $long" order="descending" />
								<xsl:sort select="boolean(@datatype)" order="descending" />
								<xsl:sort select="@datatype" />
								<xsl:sort select="boolean(@href)" />
								<xsl:sort select="local-name()" />
								<xsl:apply-templates select="." mode="formrow">
									<xsl:with-param name="parentName" select="$propertyName" />
									<xsl:with-param name="last" select="position() = last()" />
								</xsl:apply-templates>
							</xsl:for-each>
						</table>
					</td>
				</tr>
			</xsl:if>
		</xsl:when>
		<xsl:otherwise>
			<xsl:variable name="paramName">
				<xsl:apply-templates select="." mode="paramName" />
			</xsl:variable>
			<tr>
				<xsl:if test="$last">
					<xsl:attribute name="class">last</xsl:attribute>
				</xsl:if>
				<th class="label">
					<label for="{$paramName}">
						<xsl:apply-templates select="." mode="label" />
					</label>
				</th>
				<td class="input">
					<xsl:apply-templates select="." mode="input">
						<xsl:with-param name="name" select="$paramName" />
					</xsl:apply-templates>
				</td>
			</tr>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="input">
	<xsl:param name="name" />
	<xsl:variable name="default">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri">
				<xsl:apply-templates select="/result" mode="searchURI" />
			</xsl:with-param>
			<xsl:with-param name="param" select="$name" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="@datatype = 'boolean'">
			<select name="{$name}">
				<option value="">
					<xsl:if test="$default = ''">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
				</option>
				<option>
					<xsl:if test="$default = 'true'">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:text>true</xsl:text>
				</option>
				<option>
					<xsl:if test="$default = 'false'">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:text>false</xsl:text>
				</option>
			</select>
		</xsl:when>
		<xsl:when test="@datatype = 'integer' or @datatype = 'decimal' or @datatype = 'float' or @datatype = 'double' or @datatype = 'int' or @datatype = 'date' or @datatype = 'dateTime' or @datatype = 'time'">
			<xsl:variable name="min">
				<xsl:call-template name="paramValue">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
					<xsl:with-param name="param" select="concat('min-', $name)" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="max">
				<xsl:call-template name="paramValue">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
					<xsl:with-param name="param" select="concat('max-', $name)" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:text>exactly: </xsl:text>
			<input name="{$name}" type="number" size="7">
				<xsl:apply-templates select="." mode="inputAtts" />
				<xsl:if test="$default != ''">
					<xsl:attribute name="value">
						<xsl:value-of select="$default" />
					</xsl:attribute>
				</xsl:if>
			</input>
			<br />
			<br />
			<em>or</em>
			<xsl:text> between: </xsl:text>
			<input name="min-{$name}">
				<xsl:apply-templates select="." mode="inputAtts" />
				<xsl:if test="$min != ''">
					<xsl:attribute name="value">
						<xsl:value-of select="$min" />
					</xsl:attribute>
				</xsl:if>
			</input>
			<br />
			<xsl:text>and </xsl:text>
			<input name="max-{$name}">
				<xsl:apply-templates select="." mode="inputAtts" />
				<xsl:if test="$max != ''">
					<xsl:attribute name="value">
						<xsl:value-of select="$max" />
					</xsl:attribute>
				</xsl:if>
			</input>
		</xsl:when>
		<xsl:otherwise>
			<input name="{$name}" size="25">
				<xsl:if test="$default != ''">
					<xsl:attribute name="value">
						<xsl:value-of select="$default" />
					</xsl:attribute>
				</xsl:if>
			</input>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="inputAtts">
	<xsl:choose>
		<xsl:when test="@datatype = 'date'">
			<xsl:attribute name="type">date</xsl:attribute>
			<xsl:attribute name="size">10</xsl:attribute>
			<xsl:attribute name="placeholder">YYYY-MM-DD</xsl:attribute>
			<xsl:attribute name="pattern">[0-9]{4}-[0-9]{2}-[0-9]{2}</xsl:attribute>
		</xsl:when>
		<xsl:when test="@datatype = 'time'">
			<xsl:attribute name="type">time</xsl:attribute>
			<xsl:attribute name="size">8</xsl:attribute>
			<xsl:attribute name="placeholder">hh:mm:ss</xsl:attribute>
			<xsl:attribute name="pattern">[0-9]{2}:[0-9]{2}:[0-9]{2}</xsl:attribute>
		</xsl:when>
		<xsl:when test="@datatype = 'dateTime'">
			<xsl:attribute name="type">datetime</xsl:attribute>
			<xsl:attribute name="size">19</xsl:attribute>
			<xsl:attribute name="placeholder">YYYY-MM-DDThh:mm:ss</xsl:attribute>
			<xsl:attribute name="pattern">[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}</xsl:attribute>
		</xsl:when>
		<xsl:when test="@datatype = 'integer' or @datatype = 'decimal' or @datatype = 'float' or @datatype = 'double' or @datatype = 'int'">
			<xsl:attribute name="type">number</xsl:attribute>
			<xsl:attribute name="size">7</xsl:attribute>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="header" />
<xsl:template match="*" mode="footer" />

</xsl:stylesheet>