using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Jumoo.TranslationManager.Core.Configuration;
using Jumoo.TranslationManager.Core.Models;
using Jumoo.TranslationManager.Core.Physical;
using Jumoo.TranslationManager.Core.Providers;
using Jumoo.TranslationManager.Core.Serializers;
using Jumoo.TranslationManager.Serializers;

using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;

using Umbraco.Core;
using Umbraco.Web;

namespace Translation.ExampleProvider
{
    public class ExampleProvider : ITranslationProvider
    {
        public string Name => "Example Connector"; // n.b providers are called 'connectors' in v8

        public string Alias => "example";

        public Guid Key => Guid.Parse("F365B78F-5F3C-4BB5-A9E1-EAE6979E059E");

        public TranslationProviderViews Views => new TranslationProviderViews()
        {
            Pending = UriUtility.ToAbsolute("/App_Plugins/ExampleConnector/create.html"),
            Submitted = UriUtility.ToAbsolute("/App_Plugins/ExampleConnector/submitted.html"),
            Approved = UriUtility.ToAbsolute("/App_Plugins/ExampleConnector/received.html"),
            Config = UriUtility.ToAbsolute("/App_Plugins/ExampleConnector/config.html")
        };

        private readonly TranslationFileService _fileService;
        private readonly TranslationManagerConfig _config;

        // some example settings you might have for your connector 
        // see Reload() function for how these are read in.

        private string XiffFormat = "xliff20";
        private bool SplitHtml = true; 

        /// <summary>
        ///  constructore - loads in the settings - any dependency injection etc. 
        /// </summary>
        public ExampleProvider(
            TranslationFileService fileService,
            TranslationManagerConfig config)
        {
            _fileService = fileService;
            _config = config;
        }

        /// <summary>
        ///  you might not want your provider to be active until some settings are set. 
        /// </summary>
        /// <returns>true if the provider is active.</returns>
        public bool Active()
            => true;

        /// <summary>
        ///  called when a job is submitted. 
        /// </summary>
        /// <param name="job">Job element containing all job and node settings.</param>
        /// <returns>Attempt result - success will move to submitted - fail will block the process</returns>
        public async Task<Attempt<TranslationJob>> Submit(TranslationJob job)
        {
            // job.providerProperties will contain any provider 
            // specific properties for this job. you can serialize/deserialize 
            // this json blob to retrieve and update any settings as you go. 
            var providerOptions = JsonConvert.DeserializeObject<ExampleProviderOptions>(job.ProviderProperties);

            var filename = $"/media/example/{job.Name.ToSafeFileName()}.xlf";

            // options we can pass to the inbuilt serializers 
            // controlling how we split / or what we include in the xliff 
            var options = new TranslationSerializerOptions()
            {
                IncludeBlankTarget = false,
                SplitHtml = true
            };

            // the standard xliff 2.0 serializer 
            var serializer = new Xliff2Serializer();

            // serialize the job to xliff 
            var attempt = serializer.Serialize(job,
                job.SourceCulture.Name,
                job.TargetCulture.Name,
                options);

            if (attempt.Success)
            {
                // write the job to disk 
                // the TranslationFileService will handle blob storage
                // if its set and we are writing to the /media/....

                // at this point you can hook into your own API
                // and send the xliff off via the api call to be translated. 
                // you would probibly want then store return ids within the job
                providerOptions.FileName = filename;
                job.ProviderProperties = JsonConvert.SerializeObject(providerOptions);

                using (var stream = new MemoryStream())
                {
                    Xliff20Loader loader = new Xliff20Loader();
                    loader.WriteToStream(stream, attempt.Result);
                    _fileService.Save(filename, stream);
                    return Attempt.Succeed(job);
                }
            }

            return Attempt.Fail(job, attempt.Exception);
        }

        /// <summary>
        ///  check the translation job status. 
        /// </summary>
        /// <remarks>
        ///  can be invoked by the user via the UI, or a background process which will periodically 
        ///  check all 'submitted' jobs to check if they have become completed. 
        ///  
        ///  if you have a callback process you can also call the JobService.Check() method which will
        ///  invoke this method on the provider and process the job. 
        /// </remarks>
        /// <param name="job"></param>
        /// <returns></returns>
        public async Task<Attempt<TranslationJob>> Check(TranslationJob job)
        {
            /// load up the job options. 
            var providerOptions = JsonConvert.DeserializeObject<ExampleProviderOptions>(job.ProviderProperties);

            // setup how we want the serializer to work
            var options = new TranslationSerializerOptions()
            {
                // e.g only when translations are coming back in 'source' not 'target' 
                // this would be true
                CopyFromSource = false
            };

            // get file from blob/disk
            if (_fileService.FileExists(providerOptions.FileName))
            {
                using(var stream = _fileService.GetFileStream(providerOptions.FileName))
                {
                    // pass through to xliff2 loader and serializer 
                    // (to get it back into the job)
                    var loader = new Xliff20Loader();
                    var doc = loader.ReadFromStream(stream);
                    if (doc != null)
                    {
                        var serializer = new Xliff2Serializer();

                        return serializer.Deserialize(doc, job, options);
                    }

                    return Attempt<TranslationJob>.Fail(new InvalidDataException("Not Recongnized as Xliff 2.0"));

                }
            }

            return Attempt<TranslationJob>.Fail(new InvalidDataException("No file found"));
        }

        /// <summary>
        ///  reload ay settings from disk
        /// </summary>
        /// <remarks>
        ///  this method is called by translation manager when a user saves the provider
        ///  settings via the UI - you should reload your settings here to ensure they 
        ///  are uptodate.
        /// </remarks>
        public void Reload()
        {
            // getProviderSettings method will read config in from the 
            // translations.config file /providers/alias section

            this.XiffFormat = _config.GetProviderSetting(Alias, "format", "xliff20");
            this.SplitHtml = _config.GetProviderSetting<bool>(Alias, "split", true);

            // this section is also read by the UI when returning settings to the 
            // config view. 
                
        }

        /// <summary>
        ///  called when a job is cancelled (archived)
        /// </summary>
        /// <remarks> 
        ///  you might want to update your api, a cancelled job can be retreived by a user
        ///  (reset) so this isn't a permiment delete. 
        /// </remarks>
        /// <returns>
        ///  successfull attempt on completion, a fail will block the cancel event.
        /// </returns>
        public async Task<Attempt<TranslationJob>> Cancel(TranslationJob job)
        {
            return await Task.FromResult(Attempt.Succeed(job));
        }

        /// <summary>
        ///  called when the user attempts to remove (delete) a job 
        /// </summary>
        /// <remarks>
        ///  removed jobs are gone forever (cannot be restored)
        ///  you might want to also remove or mark a job as removed via your api 
        /// </remarks>
        /// <returns>
        ///  successfull attempt on completion, a fail will block the remove from happening
        /// </returns>
        public async Task<Attempt<TranslationJob>> Remove(TranslationJob job)
        {
            return await Task.FromResult(Attempt.Succeed(job));
        }

        /// <summary>
        ///  can this job be translated via the API - you might want to check for 
        ///  language restrictions, 
        /// </summary>
        /// <remarks>
        ///  this method is reserved for future use, at the moment it is not called for 
        ///  each job. you should perform a check in the submit method if you wish 
        ///  to block a job creation.
        /// </remarks>
        public bool CanTranslate(TranslationJob job)
        {
            return true;
        }

        /// <summary>
        ///  return a list of languages that can be translated by this provider.
        ///  based on a passed source language. 
        /// </summary>
        /// <remarks>
        ///  this method is reserved for future use and does not currently have 
        ///  a place in the translation manager UI. 
        /// </remarks>
        public IEnumerable<string> GetTargetLanguages(string sourceLanguage)
        {
            throw new NotImplementedException();
        }
    }


    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ExampleProviderOptions
    {
        public string Description { get; set; }
        public string FileName { get; set; }

    }
}
