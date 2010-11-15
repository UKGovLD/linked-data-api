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

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:choose>
		<xsl:when test="starts-with(@href, $postcodeSectorPrefix)">
			<xsl:variable name="base" select="concat('/lod/os/postcode-sector/', substring-after(@href, $postcodeSectorPrefix))" />
			<ul>
				<li><a href="{$base}/unit">Postcodes</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, $postcodeDistrictPrefix)">
			<xsl:variable name="base" select="concat('/lod/os/postcode-district/', substring-after(@href, $postcodeDistrictPrefix))" />
			<ul>
				<li><a href="{$base}/unit">Postcodes</a></li>
				<li><a href="{$base}/sector">Postcode sectors</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, $postcodeAreaPrefix)">
			<xsl:variable name="base" select="concat('/lod/os/postcode-area/', substring-after(@href, $postcodeAreaPrefix))" />
			<ul>
				<li><a href="{$base}/unit">Postcodes</a></li>
				<li><a href="{$base}/sector">Postcode sectors</a></li>
				<li><a href="{$base}/district">Postcode districts</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>