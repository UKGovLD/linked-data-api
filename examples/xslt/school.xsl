<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="@href" mode="uri">
	<xsl:choose>
		<xsl:when test="starts-with(., 'http://education.data.gov.uk/id/')">
			<xsl:value-of select="concat('/education/api/', substring-after(., 'id/'))" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="." />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>