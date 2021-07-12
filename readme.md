## Translation Manager Connection Demo
This repo contains a simple demo project showing you how to create a Translation Connector for [Jumoo Translation Manager for Umbraco](https://jumoo.co.uk/translate/)

The sample connector, writes a xliff 2.0 file to disk (in media/examples) and then when you check the job it will attempt to load the same file and look to see if its translated. 

this is very cut down version of what the inbuilt xliff connector does but the code shows you where you would hook into the process for your own api/endpoints etc. 

