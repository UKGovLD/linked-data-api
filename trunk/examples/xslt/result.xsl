<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:variable name="openSpaceAPIkey" select="'91BDD27E0581EC9FE0405F0ACA603BCF'" />

<xsl:key name="properties" match="/result/items/item/* | /result[not(items)]/primaryTopic/*" use="name(.)" />
<xsl:key name="properties" match="/result/items/item/*/* | /result[not(items)]/primaryTopic/*/*" use="concat(name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/* | /result[not(items)]/primaryTopic/*/*/*" use="concat(name(../..), '.', name(..), '.', name(.))" />
	
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
				<xsl:apply-templates select="." mode="search" />
				<xsl:apply-templates select="." mode="footer" />
			</div>
		</body>
	</html>
</xsl:template>

<xsl:template match="result" mode="title">
	<title>Search Results</title>
</xsl:template>

<xsl:template match="result" mode="meta">
	<xsl:apply-templates select="first | prev | next | last" mode="metalink" />
	<xsl:apply-templates select="format/item" mode="metalink" />
</xsl:template>

<xsl:template match="first | prev | next | last" mode="metalink">
	<link rel="{local-name(.)}" href="{@href}" />
</xsl:template>

<xsl:template match="format/item" mode="metalink">
	<link rel="alternate" href="{@href}" type="format/label" />
</xsl:template>

<xsl:template match="result" mode="style">
	<link rel="stylesheet" href="/css/html5reset-1.6.1.css" type="text/css" />
	<link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.3/themes/base/jquery-ui.css" type="text/css" />
	<link rel="stylesheet" href="/css/black-tie/jquery-ui-1.8.5.custom.css" type="text/css" />
	<link rel="stylesheet" href="/css/result.css" type="text/css" />
</xsl:template>

<xsl:template match="result" mode="script">
	<xsl:comment>
		<xsl:text>[if lt IE 9]&gt;</xsl:text>
		<xsl:text>&lt;script src="http://html5shiv.googlecode.com/svn/trunk/html5.js">&lt;/script></xsl:text>
		<xsl:text>&lt;![endif]</xsl:text>
	</xsl:comment>
	<xsl:if test="items/item[easting and northing] or (not(items) and primaryTopic[easting and northing])">
		<script type="text/javascript"
     src="http://openspace.ordnancesurvey.co.uk/osmapapi/openspace.js?key={$openSpaceAPIkey}"></script>
	</xsl:if>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/jquery-ui.min.js"></script>
	<script type="text/javascript">
		$(function() {
		
			$('input[type=date]').datepicker({
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				autoSize: true
			});
			
			<xsl:if test="items/item[easting and northing] or primaryTopic[easting and northing]">
				initMap();
				
			</xsl:if>
		});
	</script>
</xsl:template>

<xsl:template match="result" mode="header">
	<nav class="site" />
</xsl:template>

<xsl:template match="result" mode="footer">
	<footer>
		<xsl:apply-templates select="." mode="formats" />
		<p>
			<a href="http://www.axialis.com/free/icons">Icons</a> by <a href="http://www.axialis.com">Axialis Team</a>
		</p>
	</footer>
</xsl:template>

<xsl:template match="result" mode="formats">
	<nav>
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
	</nav>
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
					<h1>Search Results</h1>
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
	<nav class="topnav">
		<xsl:apply-templates select="." mode="map" />
		<xsl:if test="items/item[@href]">
			<xsl:apply-templates select="." mode="summary" />
		</xsl:if>
		<xsl:if test="items">
			<xsl:apply-templates select="." mode="filternav" />
		</xsl:if>
		<xsl:if test="items/item[@href] or (not(items) and primaryTopic)">
			<xsl:apply-templates select="." mode="viewnav" />
		</xsl:if>
		<xsl:if test="items/item[@href]">
			<xsl:apply-templates select="." mode="sizenav" />
			<xsl:apply-templates select="." mode="sortnav" />
		</xsl:if>
	</nav>
</xsl:template>
	
<xsl:template match="result" mode="map">
	<xsl:choose>
		<xsl:when test="items/item[easting and northing] or (not(items) and primaryTopic[easting and northing])">
			<xsl:variable name="minEasting">
				<xsl:call-template name="min">
					<xsl:with-param name="values" select="items/item/easting | primaryTopic/easting" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="maxEasting">
				<xsl:call-template name="max">
					<xsl:with-param name="values" select="items/item/easting | primaryTopic/easting" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="minNorthing">
				<xsl:call-template name="min">
					<xsl:with-param name="values" select="items/item/northing | primaryTopic/northing" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="maxNorthing">
				<xsl:call-template name="max">
					<xsl:with-param name="values" select="items/item/northing | primaryTopic/northing" />
				</xsl:call-template>
			</xsl:variable>
			<section class="map">
				<h1>Map</h1>
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
						osMap = new OpenSpace.Map('map', {controls: controls});
						osMap.addControl(new OpenSpace.Control.SmallMapControl());
						var info;
						<xsl:choose>
							<xsl:when test="items">
					      var bounds = new OpenLayers.Bounds(<xsl:value-of select="$minEasting"/>, <xsl:value-of select="$minNorthing"/>, <xsl:value-of select="$maxEasting"/>, <xsl:value-of select="$maxNorthing"/>);
								var zoom = osMap.getZoomForExtent(bounds);
								var center = new OpenSpace.MapPoint(<xsl:value-of select="$minEasting + floor(($maxEasting - $minEasting) div 2)" />, <xsl:value-of select="$minNorthing + floor(($maxNorthing - $minNorthing) div 2)" />);
							</xsl:when>
							<xsl:otherwise>
								var zoom = 7;
								var center = new OpenSpace.MapPoint(<xsl:value-of select="primaryTopic/easting" />, <xsl:value-of select="primaryTopic/northing" />);
							</xsl:otherwise>
						</xsl:choose>
			      osMap.setCenter(center, zoom);
			      var markers = new OpenLayers.Layer.Markers("Markers");
			      osMap.addLayer(markers);
			      var size = new OpenLayers.Size(16,16);
						var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
						var icon = new OpenLayers.Icon('/images/orange/16x16/Target.png', size, offset);
			      var pos;
			      var marker;
			      <xsl:for-each select="items/item[easting and northing] | primaryTopic[easting and northing]">
			      	<xsl:sort select="northing" order="descending" data-type="number" />
			      	<xsl:sort select="easting" order="descending" data-type="number" />
				      pos = new OpenSpace.MapPoint(<xsl:value-of select="easting" />, <xsl:value-of select="northing"/>);
				      marker = new OpenLayers.Marker(pos, icon.clone());
				      <xsl:if test="items">
					      marker.events.on({
					      	mouseover: function () {
					      		info.setHTML('&lt;div class=\"mapInfo\">&lt;a href=\"#item<xsl:value-of select="count(preceding-sibling::item) + 1"/>\"><xsl:call-template name="jsEscape"><xsl:with-param name="string"><xsl:apply-templates select="." mode="name" /></xsl:with-param></xsl:call-template>&lt;/a>&lt;/div>');
					      	}
					      });
				      </xsl:if>
				      markers.addMarker(marker);
			      </xsl:for-each>
						<xsl:if test="items">
							info = new OpenSpace.Layer.ScreenOverlay("info");
							info.setPosition(new OpenLayers.Pixel(85, 0));
							osMap.addLayer(info);
							info.setHTML('&lt;div class=\"mapInfo\">Mouse over a marker&lt;/div>');
						</xsl:if>
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

<xsl:template match="result" mode="summary">
	<xsl:if test="count(items/item) > 1">
		<section class="summary">
			<h1>Quick Links</h1>
			<ul>
				<xsl:for-each select="items/item">
					<li>
						<a href="#item{position()}" title="jump to item on this page">
							<xsl:apply-templates select="." mode="name" />
						</a>
					</li>
				</xsl:for-each>
			</ul>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="name">
	<xsl:choose>
		<xsl:when test="prefLabel"><xsl:apply-templates select="prefLabel" mode="content" /></xsl:when>
		<xsl:when test="name"><xsl:apply-templates select="name" mode="content" /></xsl:when>
		<xsl:when test="title"><xsl:apply-templates select="title" mode="content" /></xsl:when>
		<xsl:when test="label"><xsl:apply-templates select="label" mode="content" /></xsl:when>
		<xsl:when test="alias"><xsl:apply-templates select="alias" mode="content" /></xsl:when>
		<xsl:when test="altLabel"><xsl:apply-templates select="altLabel" mode="content" /></xsl:when>
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
			<table>
				<xsl:copy-of select="$filters" />
			</table>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template name="extractFilters">
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
	<xsl:if test="not(starts-with($param, '_'))">
		<xsl:variable name="paramName" select="substring-before($param, '=')" />
		<tr>
			<th class="label">
				<xsl:choose>
					<xsl:when test="$paramName = 'label' or $paramName = 'prefLabel' or $paramName = 'altLabel' or $paramName = 'name' or $paramName = 'alias' or $paramName = 'title'">
						<xsl:value-of select="$paramName" />
					</xsl:when>
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
					<img src="/images/orange/16x16/Back.png" alt="remove filter" />
				</a>
			</td>
		</tr>
	</xsl:if>
	<xsl:if test="contains($params, '&amp;')">
		<xsl:call-template name="extractFilters">
			<xsl:with-param name="params" select="substring-after($params, '&amp;')" />
		</xsl:call-template>
	</xsl:if>
</xsl:template>

<xsl:template match="result" mode="viewnav">
	<xsl:variable name="view">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="@href" />
			<xsl:with-param name="param" select="'_view'" />
		</xsl:call-template>
	</xsl:variable>
	<section class="view">
		<h1>View</h1>
		<ul>
			<xsl:for-each select="version/item | version[not(item)]">
				<li>
					<xsl:apply-templates select="." mode="nav">
						<xsl:with-param name="current" select="$view" />
					</xsl:apply-templates>
				</li>
			</xsl:for-each>
		</ul>
	</section>
</xsl:template>

<xsl:template match="result" mode="sizenav">
	<section class="size">
		<h1>Items per page</h1>
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
			<a title="view {$size} items per page">
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
	<xsl:variable name="current">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri">
				<xsl:apply-templates select="/result" mode="searchURI" />
			</xsl:with-param>
			<xsl:with-param name="param" select="'_sort'" />
		</xsl:call-template>
	</xsl:variable>
	<section class="sort">
		<h1>Sort by</h1>
		<xsl:if test="$current != ''">
			<p class="reset">
				<a title="remove sorting">
					<xsl:attribute name="href">
						<xsl:call-template name="substituteParam">
							<xsl:with-param name="uri">
								<xsl:apply-templates select="/result" mode="searchURI" />
							</xsl:with-param>
							<xsl:with-param name="param" select="'_sort'" />
							<xsl:with-param name="value" select="''" />
						</xsl:call-template>
					</xsl:attribute>
					<img src="/images/orange/16x16/Cancel.png" alt="reset" />
				</a>
			</p>
		</xsl:if>
		<ul>
			<xsl:if test="$current != ''">
				<xsl:apply-templates select="." mode="selectedSorts">
					<xsl:with-param name="sorts" select="$current" />
				</xsl:apply-templates>
			</xsl:if>
			<xsl:for-each select="items/item/*[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
				<xsl:sort select="self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="sortentry">
					<xsl:with-param name="current" select="$current" />
				</xsl:apply-templates>
			</xsl:for-each>
		</ul>
	</section>
</xsl:template>

<xsl:template match="result" mode="selectedSorts">
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
	<li class="selected">
		<a title="remove this sort">
			<xsl:attribute name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
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
			<img src="/images/orange/16x16/Cancel.png" alt="remove this sort" />
		</a>
		<a>
			<xsl:attribute name="href">
				<xsl:call-template name="substituteParam">
					<xsl:with-param name="uri">
						<xsl:apply-templates select="/result" mode="searchURI" />
					</xsl:with-param>
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
					<img src="/images/orange/16x16/Arrow3 Down.png" alt="sort in ascending order" />
				</xsl:when>
				<xsl:otherwise>
					<img src="/images/orange/16x16/Arrow3 Up.png" alt="sort in descending order" />
				</xsl:otherwise>
			</xsl:choose>
		</a>
		<xsl:text> </xsl:text>
		<xsl:choose>
			<xsl:when test="$paramName = 'label' or $paramName = 'prefLabel' or $paramName = 'altLabel' or $paramName = 'name' or $paramName = 'alias' or $paramName = 'title'">
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
			<xsl:with-param name="sorts" select="substring-after($sorts, ',')" />
			<xsl:with-param name="previousSorts" select="concat($previousSorts, ',', $sort)" />
		</xsl:apply-templates>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="sortentry">
	<xsl:param name="current" />
	<xsl:variable name="paramName">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="*[not(self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title)]">
			<xsl:for-each select="key('properties', $paramName)/*[generate-id(key('properties', concat($paramName, '.', name(.)))[1]) = generate-id(.)]">
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:apply-templates select="." mode="sortentry">
					<xsl:with-param name="current" select="$current" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="sort">
				<xsl:with-param name="current" select="$current" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[(not(*) or prefLabel or name or title or label or altLabel or alias)]" mode="sort">
	<xsl:param name="current" />
	<xsl:variable name="name">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:if test="not(contains(concat(',', $current, ','), concat(',', $name, ',')) or contains(concat(',', $current, ','), concat(',-', $name, ',')))">
		<xsl:variable name="ascending">
			<xsl:call-template name="substituteParam">
				<xsl:with-param name="uri">
					<xsl:apply-templates select="/result" mode="searchURI" />
				</xsl:with-param>
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
			<a href="{$ascending}" title="sort in ascending order">
				<img src="/images/grey/16x16/Arrow3 Up.png" alt="sort in ascending order" />
			</a>
			<a title="sort in descending order">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
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
				<img src="/images/grey/16x16/Arrow3 Down.png" alt="sort in descending order" />
			</a>
			<xsl:text> </xsl:text>
			<a href="{$ascending}" title="sort in ascending order">
				<xsl:apply-templates select="." mode="contextLabel" />
			</a>
		</li>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="paramHierarchy">
	<xsl:if test="not(parent::item/parent::items/parent::result or parent::primaryTopic/parent::result)">
		<xsl:apply-templates select="parent::*" mode="paramHierarchy" />
		<xsl:if test="not(parent::item)">.</xsl:if>
	</xsl:if>
	<xsl:if test="not(self::item)">
		<xsl:value-of select="name(.)" />
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="paramName">
	<xsl:choose>
		<xsl:when test="item"><xsl:apply-templates select="item[1]" mode="paramName" /></xsl:when>
		<xsl:when test="prefLabel"><xsl:apply-templates select="prefLabel" mode="paramHierarchy" /></xsl:when>
		<xsl:when test="name"><xsl:apply-templates select="name" mode="paramHierarchy" /></xsl:when>
		<xsl:when test="title"><xsl:apply-templates select="title" mode="paramHierarchy" /></xsl:when>
		<xsl:when test="label"><xsl:apply-templates select="label" mode="paramHierarchy" /></xsl:when>
		<xsl:when test="alias"><xsl:apply-templates select="alias" mode="paramHierarchy" /></xsl:when>
		<xsl:when test="altLabel"><xsl:apply-templates select="altLabel" mode="paramHierarchy" /></xsl:when>
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
	<a href="{@href}" type="{format/label}" rel="alternate" title="view in {name} format">
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
	<h1>
		<xsl:apply-templates select="." mode="name" />
	</h1>
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
	<section id="item{position()}">
		<xsl:apply-templates select="." mode="header" />
		<xsl:apply-templates select="." mode="content" />
		<xsl:apply-templates select="." mode="footer" />
	</section>
</xsl:template>

<xsl:template match="item" mode="header">
</xsl:template>

<xsl:template match="item" mode="content" priority="20">
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

<xsl:template match="item | primaryTopic" mode="map">
	<xsl:variable name="id" select="concat('map', count(preceding-sibling::item) + 1)" />
	<div class="mapWrapper">
		<div id="{$id}" class="itemMap">
		</div>
	</div>
	<script type="text/javascript">
		var controls = [
<!--	new OpenLayers.Control.Navigation(), -->
<!--	new OpenLayers.Control.KeyboardDefaults(), -->
			new OpenLayers.Control.ArgParser()
		];
		osMap = new OpenSpace.Map('<xsl:value-of select="$id"/>', {controls: controls});
		var center = new OpenSpace.MapPoint(<xsl:value-of select="easting" />, <xsl:value-of select="northing" />);
    osMap.setCenter(center, 9);
    var markers = new OpenLayers.Layer.Markers("Markers");
    osMap.addLayer(markers);
    var size = new OpenLayers.Size(16,16);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var icon = new OpenLayers.Icon('/images/orange/16x16/Target.png', size, offset);
    pos = new OpenSpace.MapPoint(<xsl:value-of select="easting" />, <xsl:value-of select="northing"/>);
    marker = new OpenLayers.Marker(pos, icon);
    markers.addMarker(marker);
	</script>
</xsl:template>

<xsl:template match="*" mode="table">
	<table>
		<xsl:choose>
			<xsl:when test="self::primaryTopic/parent::result" />
			<xsl:when test="prefLabel">
				<xsl:apply-templates select="prefLabel" mode="caption" />
			</xsl:when>
			<xsl:when test="name">
				<xsl:apply-templates select="name" mode="caption" />
			</xsl:when>
			<xsl:when test="title">
				<xsl:apply-templates select="title" mode="caption" />
			</xsl:when>
			<xsl:when test="label">
				<xsl:apply-templates select="label" mode="caption" />
			</xsl:when>
			<xsl:when test="alias">
				<xsl:apply-templates select="alias" mode="caption" />
			</xsl:when>
			<xsl:when test="altLabel">
				<xsl:apply-templates select="altLabel" mode="caption" />
			</xsl:when>
			<xsl:when test="@href and not(starts-with(@href, 'http://api.talis.com'))">
				<caption>
					<a>
						<xsl:attribute name="href">
							<xsl:apply-templates select="@href" mode="uri" />
						</xsl:attribute>
						<xsl:call-template name="lastURIpart">
							<xsl:with-param name="uri" select="@href" />
						</xsl:call-template>
					</a>
				</caption>
			</xsl:when>
		</xsl:choose>
		<colgroup>
			<col width="35%" />
			<col width="*" />
			<xsl:if test="(easting and northing) or (lat and long)">
				<col width="47" />
			</xsl:if>
			<col width="54" />
		</colgroup>
		<xsl:apply-templates mode="row">
			<xsl:sort select="boolean(self::easting)" order="descending" />
			<xsl:sort select="boolean(self::northing)" order="descending" />
			<xsl:sort select="boolean(self::lat)" order="descending" />
			<xsl:sort select="boolean(self::long)" order="descending" />
			<xsl:sort select="boolean(@datatype)" order="descending" />
			<xsl:sort select="@datatype" />
			<xsl:sort select="boolean(@href)" />
			<xsl:sort select="local-name()" />
		</xsl:apply-templates>
	</table>
</xsl:template>
	
<xsl:template match="prefLabel | name | title | label | altLabel | alias" mode="caption">
	<caption>
		<xsl:apply-templates select=".." mode="link">
			<xsl:with-param name="content"><xsl:value-of select="." /></xsl:with-param>
		</xsl:apply-templates>
	</caption>
</xsl:template>

<xsl:template match="prefLabel | name | title | label | altLabel | alias" mode="row" priority="5" />

<xsl:template match="*" mode="row">
	<tr class="{name(.)}">
		<th class="label"><xsl:apply-templates select="." mode="label" /></th>
		<xsl:choose>
			<xsl:when test="self::easting and ../northing">
				<td class="value">
					<xsl:apply-templates select="." mode="value" />
				</td>
				<td class="map" colspan="2">
					<xsl:choose>
						<xsl:when test="../lat and ../long">
							<xsl:attribute name="rowspan">4</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="rowspan">2</xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:apply-templates select="parent::*" mode="map" />
				</td>
			</xsl:when>
			<xsl:when test="../easting and (self::northing or (self::lat and ../long) or (self::long and ../lat))">
				<td class="value">
					<xsl:apply-templates select="." mode="value" />
				</td>
			</xsl:when>
			<xsl:when test="*[not(self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title)]">
				<td class="value nested">
					<xsl:attribute name="colspan">
						<xsl:choose>
							<xsl:when test="(../easting and ../northing) or (../lat and ../long)">3</xsl:when>
							<xsl:otherwise>2</xsl:otherwise>
						</xsl:choose>
					</xsl:attribute>
					<xsl:apply-templates select="." mode="value" />
				</td>
			</xsl:when>
			<xsl:otherwise>
				<td class="value">
					<xsl:if test="(../easting and ../northing) or (../lat and ../long)">
						<xsl:attribute name="colspan">2</xsl:attribute>
					</xsl:if>
					<xsl:apply-templates select="." mode="value" />
				</td>
				<td class="filter"><xsl:apply-templates select="." mode="filter" /></td>
			</xsl:otherwise>
		</xsl:choose>
	</tr>
</xsl:template>

<xsl:template match="*" mode="contextLabel">
	<xsl:if test="not(parent::item/parent::items/parent::result)">
		<xsl:apply-templates select="parent::*" mode="contextLabel" />
		<xsl:if test="not(parent::item)"><xsl:text> </xsl:text></xsl:if>
	</xsl:if>
	<xsl:if test="not(self::item)">
		<xsl:apply-templates select="." mode="label" />
	</xsl:if>
</xsl:template>

<!-- 
	ordering for efficiency based on occurrence as first letter of word:
	http://letterfrequency.org/#words-begin-with-letter-frequency
-->
<xsl:variable name="uppercase" select="'TAISOWHBCMFPDRLEGNYUKVJQXZ'" />
<xsl:variable name="lowercase" select="'taisowhbcmfpdrlegnyukvjqxz'" />
<xsl:variable name="numbers" select="'0123456789'" />

<xsl:template match="*" mode="label">
	<xsl:param name="label" select="local-name(.)" />
	<xsl:choose>
		<xsl:when test="translate($label, $uppercase, '') = ''">
			<xsl:value-of select="$label" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$label" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="splitPath">
	<xsl:param name="paramName" />
	<xsl:choose>
		<xsl:when test="contains($paramName, '-')">
			<xsl:value-of select="substring-before($paramName, '-')" />
			<xsl:text> </xsl:text>
			<xsl:call-template name="splitPath">
				<xsl:with-param name="paramName" select="substring-after($paramName, '-')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="contains($paramName, '.')">
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="substring-before($paramName, '.')" />
			</xsl:call-template>
			<xsl:text> </xsl:text>
			<xsl:call-template name="splitPath">
				<xsl:with-param name="paramName" select="substring-after($paramName, '.')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="$paramName = 'label' or $paramName = 'prefLabel' or $paramName = 'altLabel' or $paramName = 'name' or $paramName = 'alias' or $paramName = 'title'" />
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$paramName" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="splitOnCapital">
	<xsl:param name="string" />
	<xsl:param name="letters" select="$uppercase" />
	<xsl:variable name="letter" select="substring($letters, 1, 1)" />
	<xsl:variable name="rest" select="substring($letters, 2)" />
	<xsl:choose>
		<xsl:when test="$string = '' or $letters = ''" />
		<xsl:when test="contains(substring($string, 1, 1), $numbers)">
			<xsl:variable name="charAfterNumber"
				select="substring(translate($string, $numbers, ''), 1, 1)" />
			<xsl:choose>
				<xsl:when test="$charAfterNumber = ''">
					<xsl:value-of select="$string" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:variable name="number" select="substring-before($string, $charAfterNumber)" />
					<xsl:value-of select="$number" />
					<xsl:text> </xsl:text>
					<xsl:call-template name="splitOnCapital">
						<xsl:with-param name="string" select="substring-after($string, $number)" />
						<xsl:with-param name="letters" select="$letters" />
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:when test="contains($string, $letter)">
			<xsl:variable name="before" select="substring-before($string, $letter)" />
			<xsl:variable name="after" select="substring-after($string, $letter)" />
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$before" />
				<xsl:with-param name="letters" select="$rest" />
			</xsl:call-template>
			<xsl:choose>
				<xsl:when test="$after != '' and translate(substring($after, 1, 1), $lowercase, '') = ''">
					<xsl:text> </xsl:text>
					<xsl:value-of select="translate($letter, $uppercase, $lowercase)" />
				</xsl:when>
				<xsl:when test="$before != '' and translate(substring($before, string-length($before), 1), $lowercase, '') = ''">
					<xsl:text> </xsl:text>
					<xsl:value-of select="$letter" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$letter" />
				</xsl:otherwise>
			</xsl:choose>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$after" />
				<xsl:with-param name="letters" select="$letters" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="$rest = '' or translate($string, $rest, '') = $string">
			<xsl:value-of select="$string" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$string" />
				<xsl:with-param name="letters" select="$rest" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="value">
	<xsl:apply-templates select="." mode="link">
		<xsl:with-param name="content">
			<xsl:apply-templates select="." mode="display" />
		</xsl:with-param>
	</xsl:apply-templates>
</xsl:template>
	
<xsl:template match="*[@datatype = 'boolean']" mode="display">
	<xsl:choose>
		<xsl:when test=". = 'true'">
			<img src="/images/grey/16x16/Ok.png" alt="true" />
		</xsl:when>
		<xsl:when test=". = 'false'">
			<img src="/images/grey/16x16/Cancel.png" alt="false" />
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
					<xsl:value-of select="substring-after(., 'T')" />
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="." mode="content" />
			</xsl:otherwise>
		</xsl:choose>
	</time>
</xsl:template>

<xsl:template match="*" mode="display">
	<xsl:apply-templates select="." mode="content" />
</xsl:template>

<xsl:template match="*[prefLabel]" mode="content" priority="10">
	<xsl:apply-templates select="prefLabel" mode="content" />
</xsl:template>

<xsl:template match="*[name]" mode="content" priority="9">
	<xsl:apply-templates select="name" mode="content" />
</xsl:template>

<xsl:template match="*[title]" mode="content" priority="8">
	<xsl:apply-templates select="title" mode="content" />
</xsl:template>

<xsl:template match="*[label]" mode="content" priority="7">
	<xsl:apply-templates select="label" mode="content" />
</xsl:template>

<xsl:template match="*[altLabel]" mode="content" priority="6">
	<xsl:apply-templates select="altLabel" mode="content" />
</xsl:template>

<xsl:template match="*[alias]" mode="content" priority="5">
	<xsl:apply-templates select="alias" mode="content" />
</xsl:template>

<xsl:template match="label[item] | prefLabel[item] | altLabel[item] | name[item] | alias[item] | title[item]" mode="content" priority="10">
	<xsl:for-each select="item">
		<xsl:value-of select="." />
		<xsl:if test="position() != last()"> / </xsl:if>
	</xsl:for-each>
</xsl:template>

<xsl:template match="*[item]" mode="content" priority="4">
	<xsl:choose>
		<xsl:when test="item[*[not(self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title)]]">
			<xsl:apply-templates select="item" mode="content" />
		</xsl:when>
		<xsl:otherwise>
			<ul>
				<xsl:apply-templates select="item" mode="listitem" />
			</ul>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*[*]" mode="content" priority="3">
	<xsl:apply-templates select="." mode="table" />
</xsl:template>

<xsl:template match="*[@href]" mode="content">
	<xsl:call-template name="lastURIpart">
		<xsl:with-param name="uri" select="@href" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="*" mode="content">
	<xsl:value-of select="." />
</xsl:template>

<xsl:template match="*[* and not(label or prefLabel or altLabel or name or alias or title)]" mode="filter" />

<xsl:template match="*" mode="filter">
	<xsl:variable name="paramName">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:variable name="paramValue">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri">
				<xsl:apply-templates select="/result" mode="searchURI" />
			</xsl:with-param>
			<xsl:with-param name="param" select="$paramName" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test=". = ''" />
		<xsl:when test="$paramValue = .">
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
				<img src="/images/orange/16x16/Back.png" alt="remove filter" />
			</a>
		</xsl:when>
		<xsl:when test="@datatype = 'integer' or @datatype = 'decimal' or @datatype = 'float' or @datatype = 'int' or @datatype = 'date' or @datatype = 'dateTime' or @datatype = 'time'">
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
				<xsl:when test="$max = .">
					<a title="remove maximum value filter">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('max-', $paramName)" />
								<xsl:with-param name="value" select="''" />
							</xsl:call-template>
						</xsl:attribute>
						<img src="/images/orange/16x16/Back.png" alt="remove maximum value filter" />
					</a>
				</xsl:when>
				<xsl:otherwise>
					<a title="filter to values less than {.}">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('max-', $paramName)" />
								<xsl:with-param name="value" select="." />
							</xsl:call-template>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="$max != ''">
								<img src="/images/orange/16x16/Arrow3 Left.png" alt="less than {.}" />
							</xsl:when>
							<xsl:otherwise>
								<img src="/images/grey/16x16/Arrow3 Left.png" alt="less than {.}" />
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:otherwise>
			</xsl:choose>
			<a title="more like this">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="$paramName" />
						<xsl:with-param name="value" select="." />
					</xsl:call-template>
				</xsl:attribute>
				<img src="/images/grey/16x16/Search.png" alt="more like this" />
			</a>
			<xsl:choose>
				<xsl:when test="$min = .">
					<a title="remove minimum value filter">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('min-', $paramName)" />
								<xsl:with-param name="value" select="''" />
							</xsl:call-template>
						</xsl:attribute>
						<img src="/images/orange/16x16/Back.png" alt="remove minimum value filter" />
					</a>
				</xsl:when>
				<xsl:otherwise>
					<a title="more than {.}">
						<xsl:attribute name="href">
							<xsl:call-template name="substituteParam">
								<xsl:with-param name="uri">
									<xsl:apply-templates select="/result" mode="searchURI" />
								</xsl:with-param>
								<xsl:with-param name="param" select="concat('min-', $paramName)" />
								<xsl:with-param name="value" select="." />
							</xsl:call-template>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="$min != ''">
								<img src="/images/orange/16x16/Arrow3 Right.png" alt="more than {.}" />
							</xsl:when>
							<xsl:otherwise>
								<img src="/images/grey/16x16/Arrow3 Right.png" alt="more than {.}" />
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<a title="more like this">
				<xsl:attribute name="href">
					<xsl:call-template name="substituteParam">
						<xsl:with-param name="uri">
							<xsl:apply-templates select="/result" mode="searchURI" />
						</xsl:with-param>
						<xsl:with-param name="param" select="$paramName" />
						<xsl:with-param name="value">
							<xsl:apply-templates select="." mode="content" />
						</xsl:with-param>
					</xsl:call-template>
				</xsl:attribute>
				<img src="/images/grey/16x16/Search.png" alt="more like this" />
			</a>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="link">
	<xsl:param name="content" />
	<xsl:choose>
		<xsl:when test="@href and not(starts-with(@href, 'http://api.talis.com'))">
			<a>
				<xsl:attribute name="href">
					<xsl:apply-templates select="@href" mode="uri" />
				</xsl:attribute>
				<xsl:copy-of select="$content" />
			</a>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$content" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="result" mode="search">
	<xsl:variable name="searchURI">
		<xsl:apply-templates select="/result" mode="searchURI" />
	</xsl:variable>
	<section id="search">
		<xsl:if test="items/item[@href] or (not(items) and primaryTopic)">
			<h1>Search</h1>
			<form action="{$searchURI}">
				<button type="submit">
					<img src="/images/orange/16x16/Search.png" alt="search" />
				</button>
				<xsl:call-template name="hiddenInputs">
					<xsl:with-param name="params" select="substring-after($searchURI, '?')" />
				</xsl:call-template>
				<table>
					<xsl:for-each select="(items/item/* | primaryTopic/*)[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
						<xsl:sort select="self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title" order="descending" />
						<xsl:sort select="boolean(@datatype)" order="descending" />
						<xsl:sort select="@datatype" />
						<xsl:sort select="boolean(@href)" />
						<xsl:sort select="name(.)" />
						<xsl:apply-templates select="." mode="formrow" />
					</xsl:for-each>
				</table>
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
	<xsl:variable name="paramName">
		<xsl:apply-templates select="." mode="paramName" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="*[not(self::item or self::label or self::prefLabel or self::altLabel or self::name or self::alias or self::title)]">
			<!-- there's a child of this kind of property that isn't an empty item element -->
			<xsl:if test="key('properties', $paramName)/*[name() != 'item' or node()]">
				<tr>
					<th class="label">
						<xsl:apply-templates select="." mode="label" />
					</th>
					<td class="input nested">
						<table>
							<xsl:for-each select="key('properties', $paramName)/*[generate-id(key('properties', concat($paramName, '.', name(.)))[1]) = generate-id(.)]">
								<xsl:sort select="boolean(@datatype)" order="descending" />
								<xsl:sort select="@datatype" />
								<xsl:sort select="boolean(@href)" />
								<xsl:sort select="local-name()" />
								<xsl:apply-templates select="." mode="formrow" />
							</xsl:for-each>
						</table>
					</td>
				</tr>
			</xsl:if>
		</xsl:when>
		<xsl:otherwise>
			<tr>
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
			<xsl:text> </xsl:text>
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
			<xsl:text> and </xsl:text>
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

<xsl:template match="@href" mode="uri">
	<xsl:value-of select="." />
</xsl:template>

<xsl:template match="result" mode="searchURI">
	<xsl:choose>
		<xsl:when test="items">
			<xsl:value-of select="first/@href" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="uriExceptLastPart">
				<xsl:with-param name="uri" select="@href" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="uriExceptLastPart">
	<xsl:param name="uri" />
	<xsl:param name="newUri" select="''" />
	<xsl:choose>
		<xsl:when test="contains($uri, '/')">
			<xsl:call-template name="uriExceptLastPart">
				<xsl:with-param name="uri" select="substring-after($uri, '/')" />
				<xsl:with-param name="newUri">
					<xsl:choose>
						<xsl:when test="$newUri = ''">
							<xsl:value-of select="substring-before($uri, '/')" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="concat($newUri, '/', substring-before($uri, '/'))"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$newUri" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="paramValue">
	<xsl:param name="uri" />
	<xsl:param name="param" />
	<xsl:call-template name="unescapeValue">
		<xsl:with-param name="value">
			<xsl:choose>
				<xsl:when test="contains($uri, concat('&amp;', $param, '='))">
					<xsl:value-of select="substring-before(concat(substring-after($uri, concat('&amp;', $param, '=')), '&amp;'), '&amp;')" />
				</xsl:when>
				<xsl:when test="contains($uri, concat('?', $param, '='))">
					<xsl:value-of select="substring-before(concat(substring-after($uri, concat('?', $param, '=')), '&amp;'), '&amp;')" />
				</xsl:when>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template name="substituteParam">
	<xsl:param name="uri" />
	<xsl:param name="param" />
	<xsl:param name="value" />
	<xsl:choose>
		<xsl:when test="$value != '' and (contains($uri, concat('&amp;', $param, '=', $value)) or contains($uri, concat('?', $param, '=', $value)))">
			<xsl:value-of select="$uri" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:variable name="base">
				<xsl:choose>
					<xsl:when test="contains($uri, concat('&amp;', $param, '='))">
						<xsl:value-of select="substring-before($uri, concat('&amp;', $param, '='))" />
						<xsl:variable name="rest" select="substring-after($uri, concat('&amp;', $param, '='))" />
						<xsl:if test="contains($rest, '&amp;')">
							<xsl:text>&amp;</xsl:text>
							<xsl:value-of select="substring-after($rest, '&amp;')" />
						</xsl:if>
					</xsl:when>
					<xsl:when test="contains($uri, concat('?', $param, '='))">
						<xsl:value-of select="substring-before($uri, concat('?', $param, '='))" />
						<xsl:variable name="rest" select="substring-after($uri, concat('?', $param, '='))" />
						<xsl:if test="contains($rest, '&amp;')">
							<xsl:text>?</xsl:text>
							<xsl:value-of select="substring-after($rest, '&amp;')" />
						</xsl:if>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$uri" />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="$value = ''">
					<xsl:value-of select="$base" />
				</xsl:when>
				<xsl:when test="contains($base, '?')">
					<xsl:value-of select="concat($base, '&amp;', $param, '=', $value)" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="concat($base, '?', $param, '=', $value)" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="lastURIpart">
	<xsl:param name="uri" />
	<xsl:choose>
		<xsl:when test="contains($uri, '#')">
			<xsl:value-of select="substring-after($uri, '#')" />
		</xsl:when>
		<xsl:when test="contains($uri, '/')">
			<xsl:call-template name="lastURIpart">
				<xsl:with-param name="uri" select="substring-after($uri, '/')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$uri" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="unescapeValue">
	<xsl:param name="value" />
	<xsl:choose>
		<xsl:when test="contains($value, '%20')">
			<xsl:value-of select="substring-before($value, '%20')" />
			<xsl:text> </xsl:text>
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-after($value, '%20')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="translate($value, '+', ' ')" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="min">
	<xsl:param name="values" />
	<xsl:param name="min" select="$values[1]" />
	<xsl:choose>
		<xsl:when test="not($values)">
			<xsl:value-of select="$min" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="min">
				<xsl:with-param name="values" select="$values[position() > 1]" />
				<xsl:with-param name="min">
					<xsl:choose>
						<xsl:when test="$values[1] &lt; $min">
							<xsl:value-of select="$values[1]" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$min" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template name="max">
	<xsl:param name="values" />
	<xsl:param name="max" select="$values[1]" />
	<xsl:choose>
		<xsl:when test="not($values)">
			<xsl:value-of select="$max" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="max">
				<xsl:with-param name="values" select="$values[position() > 1]" />
				<xsl:with-param name="max">
					<xsl:choose>
						<xsl:when test="$values[1] > $max">
							<xsl:value-of select="$values[1]" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$max" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="jsEscape">
	<xsl:param name="string" />
	<xsl:choose>
		<xsl:when test='contains($string, "&apos;")'>
			<xsl:value-of select='substring-before($string, "&apos;")' />
			<xsl:text>\'</xsl:text>
			<xsl:call-template name="jsEscape">
				<xsl:with-param name="string" select='substring-after($string, "&apos;")' />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$string" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>