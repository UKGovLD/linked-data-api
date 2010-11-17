<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:variable name="postcodeUnitPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodeunit/'" />
<xsl:variable name="postcodeSectorPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodesector/'" />
<xsl:variable name="postcodeDistrictPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodedistrict/'" />
<xsl:variable name="postcodeAreaPrefix" select="'http://data.ordnancesurvey.co.uk/id/postcodearea/'" />
	
<xsl:template match="@href" mode="uri">
	<xsl:choose>
		<xsl:when test="starts-with(., $postcodeUnitPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode/', substring-after(., $postcodeUnitPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeSectorPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-sector/', substring-after(., $postcodeSectorPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeDistrictPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-district/', substring-after(., $postcodeDistrictPrefix))" />
		</xsl:when>
		<xsl:when test="starts-with(., $postcodeAreaPrefix)">
			<xsl:value-of select="concat('/lod/os/postcode-area/', substring-after(., $postcodeAreaPrefix))" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://labs.data.gov.uk/lod')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:call-template name="labsLinks">
		<xsl:with-param name="base" select="$path" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:call-template name="labsLinks">
		<xsl:with-param name="base">
			<xsl:choose>
				<xsl:when test="starts-with(@href, 'http://data.ordnancesurvey.co.uk/id/')">
					<xsl:value-of select="concat('/doc/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="substring-after(@href, 'http://data.ordnancesurvey.co.uk')"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>
	
<xsl:template name="labsLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/postcode-sector/')">
			<xsl:variable name="sector">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-sector'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($sector, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in sector</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/postcode-district/')">
			<xsl:variable name="district">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-district'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($district, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in district</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($district, '/sector')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode sectors in district</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/postcode-area/')">
			<xsl:variable name="area">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'postcode-area'" />
				</xsl:call-template>
			</xsl:variable> 
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/unit')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcodes in area</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/sector')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode sectors in area</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="concat($area, '/district')" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Postcode districts in area</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/postcode'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcodes</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/postcode-sector'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode sectors</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/postcode-district'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode districts</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/postcode-area'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All postcode areas</xsl:with-param>
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