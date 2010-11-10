<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<!--
<xsl:template match="@href" mode="uri">
  <xsl:choose>
    <xsl:when test="starts-with(., 'transport.data.gov.uk')">
    	<xsl:variable name="sector" select="substring-before($domain, '.data.gov.uk')" />
    	<xsl:variable name="path" select="substring-after(substring-after(., 'http://'), '/')" />
    	<xsl:choose>
    		<xsl:when test="starts-with($path, 'id/')">
    			<xsl:value-of select="concat('/', $sector, '/doc/', substring-after($path, 'id/'))" />
    		</xsl:when>
    		<xsl:otherwise>
    			<xsl:value-of select="concat('/', $sector, '/', $path)" />
    		</xsl:otherwise>
    	</xsl:choose>
    </xsl:when>
  	<xsl:otherwise>
  		<xsl:value-of select="." />
  	</xsl:otherwise>
  </xsl:choose>
</xsl:template>
-->

</xsl:stylesheet>