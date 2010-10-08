<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="@href" mode="uri">
	<xsl:variable name="domain" select="substring-before(substring-after(., 'http://'), '/')" />
	<xsl:choose>
		<xsl:when test="$domain = 'education.data.gov.uk'">
			<xsl:variable name="path" select="substring-after(substring-after(., 'http://'), '/')" />
			<xsl:value-of select="concat('/education/api/', substring-after($path, 'id/'))" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>