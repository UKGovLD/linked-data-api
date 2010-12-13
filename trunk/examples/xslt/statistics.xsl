<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://statistics.data.gov.uk')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:call-template name="statisticsLinks">
		<xsl:with-param name="base" select="$path" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:call-template name="statisticsLinks">
		<xsl:with-param name="base">
			<xsl:choose>
				<xsl:when test="starts-with(@href, 'http://statistics.data.gov.uk/id/')">
					<xsl:value-of select="concat('/doc/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="substring-after(@href, 'http://statistics.data.gov.uk')"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template name="statisticsLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/eer/')">
			<xsl:variable name="eer">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'eer'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$eer" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">European region</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/government-office-region/')">
			<xsl:variable name="gor">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'government-office-region'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($gor, '/district')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Districts in government office region</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$gor" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Government office region</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/county/')">
			<xsl:variable name="county">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'county'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($county, '/ward')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Wards in county</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($county, '/district')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Districts in county</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$county" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">County</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/local-authority-district/')">
			<xsl:variable name="lad">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'local-authority-district'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($lad, '/ward')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Wards in local authority district</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$lad" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local authority district</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/local-authority/')">
			<xsl:variable name="authority">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'local-authority'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$authority" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local authority</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/local-education-authority-area/')">
			<xsl:variable name="authority">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'local-education-authority-area'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($authority, '/district')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Districts in local education authority area</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$authority" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local education authority area</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/local-education-authority/')">
			<xsl:variable name="authority">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'local-education-authority'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$authority" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local education authority</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/parliamentary-constituency/')">
			<xsl:variable name="constituency">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'parliamentary-constituency'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($constituency, '/ward')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Wards in constituency</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$constituency" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Constituency</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/electoral-ward/')">
			<xsl:variable name="ward">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'electoral-ward'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$ward" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Electoral ward</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/local-authority'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local authorities</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/local-authority-district'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local authority districts</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/county'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Counties</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/government-office-region'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Government office regions</xsl:with-param>
				</xsl:call-template>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/electoral-ward'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Electoral wards</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/parliamentary-constituency'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Parliamentary constituencies</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/eer'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">European regions</xsl:with-param>
				</xsl:call-template>
			</ul>
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/local-education-authority'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local education authorities</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/local-education-authority-area'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Local education authority areas</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/def/') and (type/item/@href = 'http://www.w3.org/2000/01/rdf-schema#Class' or type/item/@href = 'http://www.w3.org/2002/07/owl#Class')">
			<ul>
				<li><a href="{$base}/property">Properties</a></li>
				<li><a href="{$base}/instance">Instances</a></li>
				<li><a href="{$base}/subclass">Subclasses</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>